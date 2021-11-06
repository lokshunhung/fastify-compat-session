import { EventEmitter } from "stream";
import type { SessionStoreValue, Store as StoreType } from "./types";

function incompatibleMethodMessage(method: string): string {
    return `${method} is not implemented, fastify-compat-session is not 100% direct port of express-session`;
}

export abstract class Store extends EventEmitter implements StoreType {
    abstract get(sessionID: string, callback: (err: any, value?: SessionStoreValue) => void): void;
    abstract set(sessionID: string, value: SessionStoreValue, callback?: (err?: any) => void): void;
    abstract destroy(sessionID: string, callback?: (err?: any) => void): void;

    generate(req: any): any {
        throw new Error(incompatibleMethodMessage("Store#generate"));
    }

    regenerate(req: any, callback: any): any {
        throw new Error(incompatibleMethodMessage("Store#regenerate"));
    }

    load(sid: string, callback: any): any {
        throw new Error(incompatibleMethodMessage("Store#load"));
    }

    createSession(req: any, sess: any): any {
        throw new Error(incompatibleMethodMessage("Store#createSession"));
    }
}

const kStoreMap = Symbol("memoryStore.storeMap");

export class MemoryStore extends Store {
    declare [kStoreMap]: Map<string, SessionStoreValue>;

    constructor(storeMap: Map<string, SessionStoreValue> = new Map()) {
        super();
        this[kStoreMap] = storeMap;
    }

    override get(sessionID: string, callback: (err: any, value?: SessionStoreValue) => void): void {
        const session = this[kStoreMap].get(sessionID);
        callback(null, session);
    }

    override set(sessionID: string, value: SessionStoreValue, callback?: (err?: any) => void): void {
        this[kStoreMap].set(sessionID, value);
        if (callback) callback(null);
    }

    override destroy(sessionID: string, callback?: (err?: any) => void): void {
        this[kStoreMap].delete(sessionID);
        if (callback) callback(null);
    }
}
