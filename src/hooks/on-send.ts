import type { FastifyRequest, onSendHookHandler } from "fastify";
import type { TLSSocket } from "tls";
import { sign } from "../secret-signer";
import { kData, Session } from "../session";
import type { NormalizedOptions, SessionStoreValue } from "../types";

export function createOnSendHook<T = unknown>(options: NormalizedOptions): onSendHookHandler<T> {
    return async function onSendHook(request, reply, payload) {
        const logContext = Object.assign({}, options.logContext, { hook: "onSend" });
        let session = request.session as Session;

        if (session.action === null && options.saveUninitialized) {
            session.action = "update";
        }

        if (session.action === "delete") {
            const deleteCookieOptions = Object.assign({}, session.cookie.toOptions(), {
                expires: new Date(0),
                maxAge: 0,
            });
            reply.setCookie(options.cookieName, "", deleteCookieOptions);
            await storeDestroy(session.id);
            options.log.info(logContext, "Deleted session");
            return;
        }

        if (session.action === "regenerate") {
            const staleID = session.id;
            session = request.session = Session.create(
                options.idGenerator(request),
                session[kData],
                options.cookie // Use config provided through plugin options for regenerated sessions
            );
            session.action = "update";
            await storeDestroy(staleID);
            options.log.debug(logContext, "Regenerate session, stale session disposed");
        }

        if (session.action === "update" || session.cookie.hasChanged()) {
            const sessionStoreValue = { data: session[kData], cookie: session.cookie.toStore() };
            await storeSet(session.id, sessionStoreValue);
        }

        if (session.action === "update" || session.cookie.hasChanged() || session.rotated) {
            const cookieValue = sign(session.id, options);
            reply.setCookie(options.cookieName, cookieValue, session.cookie.toOptions());
        }
    };

    function storeDestroy(sessionID: string) {
        return new Promise<void>((resolve, reject) => {
            options.store.destroy(sessionID, (error) => {
                if (error) {
                    const logContext = Object.assign({}, options.logContext, { hook: "onSend", error });
                    options.log.error(logContext, "Error when trying to destroy session from store");
                    return reject(error);
                }
                resolve();
            });
        });
    }

    function storeSet(sessionID: string, value: SessionStoreValue) {
        return new Promise<void>((resolve, reject) => {
            options.store.set(sessionID, value, (error) => {
                if (error) {
                    const logContext = Object.assign({}, options.logContext, { hook: "onSend", error });
                    options.log.error(logContext, "Error when trying to set session from store");
                    return reject(error);
                }
                resolve();
            });
        });
    }
}

// TODO: implements options.secure = "auto"
// https://github.com/expressjs/session/blob/0048bcac451ad867299d404aca94c79cc8bc751d/index.js#L623-L647
// https://github.com/fastify/session/blob/8b9788d6455199f3f876f07794a32568c87c8953/lib/fastifySession.js#L177-L194
function isConnectionSecure(request: FastifyRequest): boolean {
    // socket is https server
    if (request.connection && (request.connection as TLSSocket).encrypted === true) {
        return true;
    }

    // read the proto from x-forwarded-proto header
    const header = String(request.headers["x-forwarded-proto"] || "");
    const index = header.indexOf(",");
    const proto = index === -1 ? header.toLowerCase().trim() : header.substring(0, index).toLowerCase().trim();
    if (proto === "https") {
        return true;
    }

    return false;
}
