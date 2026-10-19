import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import { F_QUESTIONS, type FKind } from "../shared/domain/f-records.js";
test("F: formularios por pasos, guardar, gráficas, detalles, editar y eliminar", async () => {
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
    confirm: () => true,
  });
  const get = (id: string) => w.document.getElementById(id) as HTMLInputElement;
  const click = (id: string) => get(id).click();
  await import("../frontend/src/app.js");
  w.document.querySelector<HTMLAnchorElement>('[data-view="f"]')!.click();
  assert.equal(get("fView").hidden, false);
  for (const kind of ["relapse", "success"] as FKind[]) {
    click(kind === "relapse" ? "fNewRelapse" : "fNewSuccess");
    assert.equal(
      w.document.querySelectorAll(".f-question").length,
      F_QUESTIONS[kind].flatMap((s) => s.questions).length + 1,
    );
    for (const section of w.document.querySelectorAll<HTMLElement>(
      "#fFormContent .f-form-section",
    )) {
      assert.equal(section.hidden, false);
    }
    assert.equal(get("fQuestionCount").textContent,
      kind === "relapse" ? "18 preguntas" : "11 preguntas");
    click("fSave");
    assert.ok(get("fFormError").textContent);
    F_QUESTIONS[kind].forEach((section) => {
      for (const q of section.questions) {
        if (q.type === "multi") {
          const boxes = w.document.querySelectorAll<HTMLInputElement>(
            `input[name="${q.id}"]`,
          );
          boxes[0].checked = true;
          if (q.id === "behaviors") boxes[1].checked = true;
        } else
          get("fAnswer-" + q.id).value =
            q.type === "scale"
              ? "7"
              : q.type === "select"
                ? q.options![0]
                : "Texto de prueba";
      }
    });
    get("fForm").dispatchEvent(
      new w.Event("submit", { bubbles: true, cancelable: true }),
    );
    assert.equal((get("fDialog") as unknown as HTMLDialogElement).open, false);
  }
  const items = JSON.parse(w.localStorage.getItem("ritmo-f-records-v1")!);
  assert.equal(items.length, 2);
  assert.equal(
    items.find((r: { kind: string }) => r.kind === "relapse").answers.behaviors
      .length,
    2,
  );
  assert.equal(w.document.querySelectorAll("[data-f-detail]").length, 2);
  assert.ok(get("fTotals").textContent?.includes("Superaciones"));
  assert.ok(get("fStrategies").textContent?.includes("Cambié de actividad"));
  w.document.querySelector<HTMLButtonElement>("[data-f-detail]")!.click();
  assert.ok(get("fDetailsContent").textContent?.includes("Texto de prueba"));
  click("fEdit");
  assert.equal(get("fAnswer-learning").value, "Texto de prueba");
  click("fClose");
  w.document.querySelector<HTMLButtonElement>("[data-f-detail]")!.click();
  click("fDelete");
  assert.equal(
    JSON.parse(w.localStorage.getItem("ritmo-f-records-v1")!).length,
    1,
  );
  assert.deepEqual(errors, []);
  w.close();
});
