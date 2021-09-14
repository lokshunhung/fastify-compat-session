import type { EventEmitter } from "events";
import type { CookieSerializeOptions } from "fastify-cookie";

export interface SessionData {}

export interface Session {
    get(key: string): any;
    set(key: string, value: any): void;
    delete(): void;
    options(opts: CookieSerializeOptions): void;
    touch(): void;
    regenerate(): void;
}

export interface Store extends EventEmitter {
    get(
        sessionID: string,
        callback: (err: any, session?: SessionData | null) => void
    ): void;
    set(
        sessionID: string,
        session: SessionData,
        callback?: (err?: any) => void
    ): void;
    destroy(sessionID: string, callback?: (err?: any) => void): void;
}
