import type { CookieSerializeOptions } from "fastify-cookie";
import type { Session as SessionType } from "./types";

const kData = Symbol("session.data");
const kCookieOptions = Symbol("session.cookieOption");

export class Session implements SessionType {
    declare [kData]: Record<string, any>;
    declare [kCookieOptions]: CookieSerializeOptions;
    declare changed: boolean;
    declare deleted: boolean;
    declare shouldRegenerate: boolean;

    constructor(data: Record<string, any>) {
        this[kData] = data;
        this[kCookieOptions] = null;
        this.changed = false;
        this.deleted = false;
        this.shouldRegenerate = false;
    }

    get(key: string): any {
        return this[kData][key];
    }

    set(key: string, value: any): void {
        this[kData][key] = value;
    }

    delete(): void {
        this.changed = true;
        this.deleted = true;
    }

    options(opts: CookieSerializeOptions): void {
        this[kCookieOptions] = opts;
    }

    touch(): void {
        this.changed = true;
    }

    regenerate(): void {
        this.deleted = true;
        this.shouldRegenerate = true;
    }
}
