import type { FastifyLoggerInstance } from "fastify";
import { sync as uidSync } from "uid-safe";
import { MemoryStore } from "./store";
import type { CompatSessionOptions, NormalizedOptions } from "./types";

function idGenerator(): string {
    return uidSync(24);
}

export function normalizeOptions(
    options: CompatSessionOptions,
    log: FastifyLoggerInstance
): asserts options is NormalizedOptions {
    options.secret = Array.isArray(options.secret) ? options.secret : [options.secret];
    options.cookieName = options.cookieName || "sid";
    options.cookie = options.cookie || null;
    options.store = options.store || new MemoryStore();
    options.idGenerator = options.idGenerator || idGenerator;
    options.saveUninitialized = options.saveUninitialized != null ? options.saveUninitialized : true;
    options.rolling = options.rolling != null ? options.rolling : true;
    options.logContext = options.logContext || { plugin: "compat-session" };
    (options as NormalizedOptions).log = log;
}
