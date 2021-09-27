import type { CookieSerializeOptions } from "fastify-cookie";
import type { SessionStoreValueCookie } from "./types";

export const kOriginal = Symbol("cookie.original");

export class Cookie {
    declare domain?: string;
    declare expires?: Date;
    declare httpOnly?: boolean;
    declare path?: string;
    declare sameSite?: boolean | "lax" | "strict" | "none";
    declare secure?: boolean;
    declare signed?: boolean;
    declare [kOriginal]: string;

    get maxAge(): number {
        return this.expires.getTime() - Date.now();
    }
    set maxAge(ms: number) {
        this.expires = new Date(Date.now() + ms);
    }

    private constructor(options: Partial<Cookie>) {
        Object.assign(this, options);
        this[kOriginal] = JSON.stringify(this);
    }

    static create(cookieOptions: CookieSerializeOptions): Cookie {
        return new Cookie({
            domain: cookieOptions.domain,
            expires: cookieOptions.maxAge // Use maxAge instead of expires when both are specified
                ? new Date(Date.now() + cookieOptions.maxAge)
                : cookieOptions.expires,
            httpOnly: cookieOptions.httpOnly,
            path: cookieOptions.path,
            sameSite: cookieOptions.sameSite,
            secure: cookieOptions.secure,
            signed: cookieOptions.signed,
        });
    }

    static fromSessionStore(storeCookie: SessionStoreValueCookie): Cookie {
        return new Cookie({
            domain: storeCookie.domain,
            expires:
                storeCookie.expires !== undefined // Note: maxAge is ignored from storeCookie
                    ? new Date(storeCookie.expires)
                    : undefined,
            httpOnly: storeCookie.httpOnly,
            path: storeCookie.path,
            sameSite: storeCookie.sameSite,
            secure: storeCookie.secure,
            signed: storeCookie.signed,
        });
    }

    toOptions(): CookieSerializeOptions {
        return {
            domain: this.domain,
            expires: this.expires,
            httpOnly: this.httpOnly,
            path: this.path,
            sameSite: this.sameSite,
            secure: this.secure,
            signed: this.signed,
        };
    }

    toStore(): SessionStoreValueCookie {
        return {
            domain: this.domain,
            expires: this.expires && this.expires.getTime(),
            httpOnly: this.httpOnly,
            path: this.path,
            sameSite: this.sameSite,
            secure: this.secure,
            signed: this.signed,
        };
    }

    hasChanged(): boolean {
        return this[kOriginal] === JSON.stringify(this);
    }
}
