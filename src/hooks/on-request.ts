import type { FastifyRequest, onRequestHookHandler } from "fastify";
import { unsign } from "../secret-signer";
import { Session } from "../session";
import type { NormalizedOptions } from "../types";

export function createOnRequestHook(options: NormalizedOptions): onRequestHookHandler {
    return function onRequestHook(request, reply, done): void {
        const logContext = Object.assign({}, options.logContext, { hook: "onRequest" });
        const sessionCookie = request.cookies[options.cookieName];

        if (!sessionCookie) {
            request.session = createNewSession(request);
            options.log.debug(logContext, "There was no cookie, created an empty session");
            return done();
        }

        const result = unsign(sessionCookie, options);
        if (!result.valid) {
            request.session = createNewSession(request);
            options.log.debug(logContext, "Failed to decode existing cookie, created an empty session");
            return done();
        }

        const sessionID = result.value;
        options.store.get(sessionID, (error, sessionStoreValue) => {
            if (error) {
                if (error.code !== "ENOENT") {
                    logContext.error = error;
                    options.log.error(logContext, "Error when trying to get session from store");
                    return done(error);
                }

                // ENOENT is expected, create a new session (ref: https://github.com/expressjs/session/blob/0048bcac451ad867299d404aca94c79cc8bc751d/index.js#L487) (ref: https://github.com/fastify/session/blob/8b9788d6455199f3f876f07794a32568c87c8953/lib/fastifySession.js#L48)
                request.session = createNewSession(request);
                options.log.debug(logContext, "ENOENT when trying to get session from store, created an empty session");
                return done();
            }

            const session = Session.restore(sessionID, sessionStoreValue!.data, sessionStoreValue!.cookie);
            session.rotated = result.rotated;

            if (session.cookie && session.cookie.expires && session.cookie.expires.getTime() <= Date.now()) {
                return options.store.destroy(session.id, (error) => {
                    if (error) {
                        logContext.error = error;
                        options.log.error(logContext, "Error when trying to destroy expired session from store");
                        return done(error);
                    }

                    request.session = createNewSession(request);
                    options.log.debug(logContext, "Session expired, created an empty session");
                    return done();
                });
            }

            request.session = session;
            options.log.info(logContext, "Session successfully loaded");
            return done();
        });
    };

    function createNewSession(request: Readonly<FastifyRequest>) {
        const sessionID = options.idGenerator(request);
        const session = Session.create(sessionID, {}, options.cookie);
        return session;
    }
}
