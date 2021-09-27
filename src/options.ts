import { sync as uidSync } from "uid-safe";
import { MemoryStore } from "./store";
import type { CompatSessionOptions, NormalizedOptions } from "./types";

function idGenerator(): string {
    return uidSync(24);
}

export function normalizeOptions(
    options: CompatSessionOptions
): asserts options is NormalizedOptions {
    options.secret = Array.isArray(options.secret)
        ? options.secret
        : [options.secret];
    options.cookieName ||= "sessionId";
    // options.cookie
    options.store ||= new MemoryStore();
    options.idGenerator ||= idGenerator;
    options.saveUninitialized =
        options.saveUninitialized != null ? options.saveUninitialized : true;
    options.rolling = options.rolling != null ? options.rolling : true;
}
