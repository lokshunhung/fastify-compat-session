import type { CookieSerializeOptions } from "fastify-cookie";

export interface Session {
    get(key: string): any;
    set(key: string, value: any): void;
    delete(): void;
    options(opts: CookieSerializeOptions): void;
    touch(): void;
    regenerate(): void;
}
