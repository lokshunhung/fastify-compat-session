import fastify from "fastify";
import fastifyCookie from "fastify-cookie";
import compatSession from "../../src/plugin";
import { MemoryStore } from "../../src/store";
import { DEFAULT_OPTIONS } from "../utils";

jest.setTimeout(30_000);

test.skip("should not set session cookie on post without params", async () => {
    // TODO: behaviour should be skipped, but checking if connection is secure in onSend is not implemented

    expect.assertions(3);

    const store = new MemoryStore();
    const app = fastify();
    app.register(fastifyCookie);
    app.register(compatSession, { ...DEFAULT_OPTIONS, store });
    app.get("/", async (request, reply) => {
        reply.code(200).send();
    });

    const response = await app.inject({
        method: "POST",
        url: "/test",
        headers: { "content-type": "application/json" },
    });
    expect(response.json()).toStrictEqual({
        statusCode: 400,
        code: "FST_ERR_CTP_EMPTY_JSON_BODY",
        error: "Bad Request",
        message: "Body cannot be empty when content-type is set to 'application/json'",
    });
    expect(response.headers).not.toHaveProperty(["set-cookie"]);
    const allSessions = await new Promise((resolve) => {
        store.all((err, sessions) => resolve(sessions));
    });
    expect(allSessions).toHaveLength(0);
});

test("should set session cookie with 'x-forwarded-proto: https' header", async () => {
    // This header is used to tell the server that the client used https to connect to load balancer / proxy

    expect.assertions(4);

    const store = new MemoryStore();
    const app = fastify();
    app.register(fastifyCookie);
    app.register(compatSession, { ...DEFAULT_OPTIONS, store });
    app.get("/", async (request, reply) => {
        request.session.set("test", {});
        reply.code(200).send();
    });

    const response1 = await app.inject({
        method: "GET",
        url: "/",
        headers: { "x-forwarded-proto": "https" },
    });
    expect(response1.headers["set-cookie"]).toMatch(/sid=[\w-]{32}.[\w-%]{43,55}; Path=\/; HttpOnly; Secure/);
    expect(response1.statusCode).toBe(200);

    const response2 = await app.inject({
        method: "GET",
        url: "/",
        headers: { "x-forwarded-proto": "https" },
    });
    expect(response2.statusCode).toBe(200);
    expect(response2.headers["set-cookie"]).toMatch(/sid=[\w-]{32}.[\w-%]{43,55}; Path=\/; HttpOnly; Secure/);
});
