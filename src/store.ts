import { EventEmitter } from "stream";
import { Session } from "./session";
import type { Session as SessionType, SessionData, Store as StoreType } from "./types";

export abstract class Store extends EventEmitter implements StoreType {
    declare generate: (ref: { set sessionID(_: string); set session(_: SessionType) }) => void;

    abstract get(sessionID: string, callback: (err: any, session?: SessionData) => void): void;
    abstract set(sessionID: string, session: SessionData, callback?: (err?: any) => void): void;
    abstract destroy(sessionID: string, callback?: (err?: any) => void): void;

    regenerate(ref: { sessionID: string; set session(_: SessionType) }, callback: (err?: any) => void): void {
        this.destroy(ref.sessionID, (err) => {
            this.generate(ref);
            callback(err);
        });
    }

    load(sessionID: string, callback: (err?: any, session?: SessionData) => void): void {
        this.get(sessionID, (err, session) => {
            if (err) return callback(err);
            if (!session) return callback();
            callback(null, { sessionID, sessionStore: this });
        });
    }

    createSession(options: { sessionID: string; sessionStore: StoreType }, sessionData: SessionData): SessionType {
        const session = new Session(sessionData);
        return session;
    }
}

const kStoreMap = Symbol("memoryStore.storeMap");

export class MemoryStore extends Store {
    declare [kStoreMap]: Map<string, SessionData>;

    constructor(storeMap: Map<string, SessionData> = new Map()) {
        super();
        this[kStoreMap] = storeMap;
    }

    override get(sessionID: string, callback: (err: any, session?: SessionData) => void): void {
        const session = this[kStoreMap].get(sessionID);
        callback(null, session);
    }

    override set(sessionID: string, session: SessionData, callback?: (err?: any) => void): void {
        this[kStoreMap].set(sessionID, session);
        callback(null);
    }

    override destroy(sessionID: string, callback?: (err?: any) => void): void {
        this[kStoreMap].delete(sessionID);
        if (callback) callback(null);
    }
}
