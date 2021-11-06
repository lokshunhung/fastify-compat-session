import type { CookieSerializeOptions } from "fastify-cookie";
import { Cookie, kOriginal } from "./cookie";
import type { Session as SessionType, SessionStoreValueCookie } from "./types";

export const kData = Symbol("session.data");

export type RequiredAction = "update" | "delete" | "regenerate";

export class Session implements SessionType {
    declare id: string;
    declare [kData]: Record<string, any>;
    declare cookie: Cookie;
    declare action: RequiredAction | null;
    declare rotated: boolean;

    private constructor(id: string, data: Record<string, any>, cookie: Cookie) {
        this.id = id;
        this[kData] = data;
        this.cookie = cookie;
        this.action = null;
        this.rotated = false;
    }

    static create(id: string, data: Record<string, any>, cookieOptions: CookieSerializeOptions | null): Session {
        const cookie = Cookie.create(cookieOptions || {});
        return new Session(id, data, cookie);
    }

    static restore(id: string, data: Record<string, any>, storeCookie: SessionStoreValueCookie): Session {
        const cookie = Cookie.fromSessionStore(storeCookie);
        return new Session(id, data, cookie);
    }

    get(key: string): any {
        return this[kData][key];
    }

    set(key: string, value: any): void {
        this.action = "update";
        this[kData][key] = value;
    }

    delete(): void {
        this.action = "delete";
    }

    options(cookieOptions: CookieSerializeOptions): void {
        if ("expires" in cookieOptions && "maxAge" in cookieOptions) {
            throw new Error("Session#options should not be set with both `expires` & `maxAge`");
        }
        const prevOriginal = this.cookie[kOriginal];
        // @ts-expect-error -- behaviour from `fastify-secure-session` is to overwrite all cookie options, bypass creation logic in static factory with the private constructor here
        this.cookie = new Cookie(cookieOptions);
        this.cookie[kOriginal] = prevOriginal;
    }

    touch(): void {
        if (this.action === null) {
            this.action = "update";
        }
    }

    regenerate(): void {
        this.action = "regenerate";
    }
}
