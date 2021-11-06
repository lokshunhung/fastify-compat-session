import type { FastifyInstance } from "fastify";
import { createOnRequestHook } from "./hooks/on-request";
import { createOnSendHook } from "./hooks/on-send";
import { normalizeOptions } from "./options";
import type { CompatSessionOptions } from "./types";

export default async function (fastify: FastifyInstance, options: CompatSessionOptions) {
    normalizeOptions(options, fastify.log);

    const onRequestHook = createOnRequestHook(options);
    const onSendHook = createOnSendHook(options);

    fastify.decorate("session", null);
    fastify.decorate("sessionStore", { getter: () => options.store });
    fastify.addHook("onRequest", onRequestHook);
    fastify.addHook("onSend", onSendHook);
}
