import fastify from "fastify";
import fastifyCookie from "fastify-cookie";
import compatSession from "../../src/plugin";
import { MemoryStore } from "../../src/store";
import { DEFAULT_OPTIONS } from "../utils";

jest.setTimeout(30_000);

test("should not set session cookie on post without params", async () => {
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
        url: "/",
        headers: { "content-type": "application/json" },
    });
    expect(Object.keys(response.headers)).not.toContain("set-cookie");
    expect(response.json()).toStrictEqual({
        statusCode: 400,
        code: "FST_ERR_CTP_EMPTY_JSON_BODY",
        error: "Bad Request",
        message: "Body cannot be empty when content-type is set to 'application/json'",
    });
    const allSessions = await new Promise((resolve) => {
        store.all((err, sessions) => resolve(sessions));
    });
    expect(allSessions).toHaveLength(0);
});
