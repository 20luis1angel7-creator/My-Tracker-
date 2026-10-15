import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
test("Inicio de sesión admin importa la copia local sin borrarla y guarda por API", async () => {
  const dom = new JSDOM(await readFile("dist/index.html", "utf8"), {
      url: "http://localhost/",
    }),
    w = dom.window;
  const errors: unknown[] = [];
  w.addEventListener("error", (e) => errors.push(e.error));
  w.matchMedia = () =>
    ({
      matches: false,
      addEventListener: () => {},
    }) as unknown as MediaQueryList;
  w.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  w.HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
  Object.assign(globalThis, {
    window: w,
    document: w.document,
    localStorage: w.localStorage,
    location: w.location,
  });
  const original = '["Coca-Cola"]';
  w.localStorage.setItem("ritmo-habits-v1", original);
  let imported = false;
  const writes: unknown[] = [];
  globalThis.fetch = async (input, init) => {
    const path = String(input);
    if (path === "/api/auth/me")
      return Response.json(
        { error: "Inicia sesión para continuar." },
        { status: 401 },
      );
    if (path === "/api/auth/login")
      return Response.json({ user: { id: "admin-id", username: "admin" } });
    if (path === "/api/data/import") {
      const body = JSON.parse(String(init?.body));
      assert.equal(body.data["ritmo-habits-v1"], original);
      imported = true;
      return Response.json({ data: body.data });
    }
    if (path === "/api/data" && init?.method === "PUT") {
      writes.push(JSON.parse(String(init.body)));
      return Response.json({ ok: true });
    }
    throw Error(path);
  };
  await import("../frontend/src/auth/bootstrap.js");
  const get = (id: string) => w.document.getElementById(id) as HTMLInputElement;
  get("authUsername").value = "admin";
  get("authPassword").value = "123456";
  get("authForm").dispatchEvent(
    new w.Event("submit", { cancelable: true, bubbles: true }),
  );
  for (
    let i = 0;
    i < 40 && w.document.body.classList.contains("auth-pending");
    i++
  )
    await new Promise((r) => setTimeout(r, 25));
  assert.equal(w.document.body.classList.contains("auth-pending"), false);
  assert.equal(imported, true);
  assert.equal(w.localStorage.getItem("ritmo-habits-v1"), original);
  assert.ok(w.localStorage.getItem("ritmo-original-backup-v1"));
  get("habitName").value = "Leer";
  get("habitForm").dispatchEvent(
    new w.Event("submit", { cancelable: true, bubbles: true }),
  );
  await new Promise((r) => setTimeout(r, 20));
  assert.ok(writes.length);
  assert.equal(w.localStorage.getItem("ritmo-habits-v1"), original);
  assert.deepEqual(errors, []);
  w.close();
});
