import test from "node:test";
import assert from "node:assert/strict";
test(
  "PostgreSQL: registro, sesiones, separación de usuarios e importación única",
  { skip: !process.env.RITMO_TEST_DATABASE_URL },
  async () => {
    process.env.DATABASE_URL = process.env.RITMO_TEST_DATABASE_URL;
    const { initializeDatabase, pool } =
      await import("../backend/src/db/database.js");
    const { handleAccountRoutes } =
      await import("../backend/src/auth/routes.js");
    await initializeDatabase();
    const call = async (path: string, body?: unknown, cookie = "") => {
      const response = await handleAccountRoutes(
        new Request("http://localhost" + path, {
          method: body === undefined ? "GET" : "POST",
          headers: {
            cookie,
            "content-type": "application/json",
            origin: "http://localhost",
          },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        }),
      );
      assert.ok(response);
      return response;
    };
    const username = "test_" + Date.now();
    let userId = "";
    try {
      assert.equal((await call("/api/data")).status, 401);
      assert.equal(
        (
          await call("/api/auth/login", {
            username: "admin",
            password: "wrongpass",
          })
        ).status,
        401,
      );
      const login = await call("/api/auth/login", {
        username: "admin",
        password: "123456",
      });
      assert.equal(login.status, 200);
      const adminCookie = login.headers.get("set-cookie")!.split(";")[0];
      assert.ok(login.headers.get("set-cookie")!.includes("HttpOnly"));
      const registered = await call("/api/auth/register", {
        username,
        password: "testing123",
      });
      assert.equal(registered.status, 200);
      const otherCookie = registered.headers.get("set-cookie")!.split(";")[0];
      userId = (await registered.json()).user.id;
      assert.equal(
        (await call("/api/data/import", { data: {} }, otherCookie)).status,
        403,
      );
      const snapshot = {
        "ritmo-habits-v1": JSON.stringify(["Legacy " + username]),
        "ritmo-tracker-v1": JSON.stringify([
          { id: username, name: "Leer", goal: 10, checks: ["2026-10-01"] },
        ]),
      };
      const first = await call(
        "/api/data/import",
        { data: snapshot },
        adminCookie,
      );
      assert.equal(first.status, 200);
      assert.equal((await first.json()).imported, true);
      assert.equal(
        (
          await (
            await call("/api/data/import", { data: snapshot }, adminCookie)
          ).json()
        ).imported,
        false,
      );
      assert.deepEqual(
        (await (await call("/api/data", undefined, otherCookie)).json()).data,
        {},
      );
      const write = await handleAccountRoutes(
        new Request("http://localhost/api/data", {
          method: "PUT",
          headers: { cookie: otherCookie, "content-type": "application/json" },
          body: JSON.stringify({
            key: "ritmo-habits-v1",
            value: '["Solo yo"]',
          }),
        }),
      );
      assert.equal(write!.status, 200);
      assert.equal(
        JSON.parse(
          (await (await call("/api/data", undefined, otherCookie)).json()).data[
            "ritmo-habits-v1"
          ],
        )[0],
        "Solo yo",
      );
      await call("/api/auth/logout", {}, otherCookie);
      assert.equal(
        (await call("/api/data", undefined, otherCookie)).status,
        401,
      );
    } finally {
      if (userId)
        await pool.query("DELETE FROM ritmo_users WHERE id=$1", [userId]);
      await pool.end();
    }
  },
);
