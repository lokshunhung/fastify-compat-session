import type { EventEmitter } from "events";
import type { FastifyLoggerInstance, FastifyRequest } from "fastify";
import type { CookieSerializeOptions } from "fastify-cookie";
import type { Store as AbstractStore } from "./store";

export interface CompatSessionOptions {
    secret: string | Array<string>;
    cookieName?: string;
    cookie?: CookieSerializeOptions | null;
    store?: Store;
    idGenerator?: (request: FastifyRequest) => string;
    saveUninitialized?: boolean;
    rolling?: boolean;
    logContext?: Record<string, any>;
}

export interface NormalizedOptions {
    secret: Array<string>;
    cookieName: string;
    cookie: CookieSerializeOptions | null;
    store: AbstractStore;
    idGenerator: (request: FastifyRequest) => string;
    saveUninitialized: boolean;
    rolling: boolean;
    logContext: Record<string, any>;
    log: FastifyLoggerInstance;
}

export interface SessionData {}

export interface SessionStoreValueCookie {
    domain?: string;
    expires?: number; // ms (unix epoch)
    httpOnly?: boolean;
    maxAge?: number;
    originalMaxAge?: number;
    path?: string;
    sameSite?: boolean | "lax" | "strict" | "none";
    secure?: boolean;
    signed?: boolean;
}

export interface SessionStoreValue {
    data: SessionData;
    cookie: SessionStoreValueCookie;
}

export interface Session {
    get id(): string;
    get(key: string): any;
    set(key: string, value: any): void;
    delete(): void;
    options(opts: CookieSerializeOptions): void;
    touch(): void;
    regenerate(): void;
}

export interface Store extends EventEmitter {
    get(sessionID: string, callback: (err: any, value?: SessionStoreValue | null) => void): void;
    set(sessionID: string, value: SessionStoreValue, callback?: (err?: any) => void): void;
    destroy(sessionID: string, callback?: (err?: any) => void): void;
}

declare module "fastify" {
    interface FastifyRequest {
        session: Session;
    }
}
