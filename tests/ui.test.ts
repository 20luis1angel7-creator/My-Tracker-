import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
test("Flujos de interfaz: hábitos, clases, recaídas, editar, calendario, estadísticas y menú", async () => {
  const dom = new JSDOM(await readFile("dist/index.html", "utf8"), {
    url: "http://localhost/",
  });
  const w = dom.window;
  const errors: unknown[] = [];
  w.addEventListener("error", (e) => errors.push(e.error));
  let mobile = false;
  const listeners: Array<() => void> = [];
  w.matchMedia = () =>
    ({
      get matches() {
        return mobile;
      },
      media: "",
      onchange: null,
      addEventListener: (
        _type: string,
        listener: EventListenerOrEventListenerObject,
      ) => listeners.push(listener as () => void),
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => true,
    }) as MediaQueryList;
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
  const el = (id: string) => w.document.getElementById(id) as HTMLInputElement;
  const click = (id: string) => (el(id) as HTMLElement).click();
  const value = (id: string, v: string) => {
    el(id).value = v;
    el(id).dispatchEvent(new w.Event("input", { bubbles: true }));
  };
  const submit = (id: string) =>
    el(id).dispatchEvent(
      new w.Event("submit", { bubbles: true, cancelable: true }),
    );
  await import("../frontend/src/app.js");
  assert.deepEqual(errors, []);
  w.document.querySelector<HTMLAnchorElement>('[data-view="tracker"]')!.click();
  assert.equal(el("trackerView").hidden, false);
  value("trackerName", "Leer");
  value("trackerGoal", "10");
  submit("trackerForm");
  assert.equal(w.document.querySelectorAll("[data-tracker-id]").length, 1);
  const check = w.document.querySelector<HTMLInputElement>(
    "[data-check-day]:not([disabled])",
  )!;
  const checkedDay = check.dataset.checkDay;
  check.checked = true;
  check.dispatchEvent(new w.Event("change", { bubbles: true }));
  assert.ok(
    JSON.parse(w.localStorage.getItem("ritmo-tracker-v1")!)[0].checks.includes(
      checkedDay,
    ),
  );
  click("trackerPrev");
  click("trackerNext");
  assert.equal(
    w.document.querySelector<HTMLInputElement>(
      `[data-check-day="${checkedDay}"]`,
    )!.checked,
    true,
  );

  w.document.querySelector<HTMLAnchorElement>('[data-view="habits"]')!.click();
  assert.equal(el("habitsView").hidden, false);
  value("habitName", "Coca-Cola");
  submit("habitForm");
  assert.ok(w.localStorage.getItem("ritmo-habits-v1")?.includes("Coca-Cola"));
  click("toggleSavedNames");
  assert.equal(el("savedHabits").hidden, false);
  value("savedCategory", "Apps");
  el("savedCategory").dispatchEvent(new w.Event("change"));
  value("savedSubcategory", "Instagram");
  click("addSubclass");
  value("savedSubcategory", "Facebook");
  click("addSubclass");
  submit("classificationForm");
  assert.equal(
    JSON.parse(w.localStorage.getItem("ritmo-classes-v1")!).apps.subclasses
      .length,
    2,
  );
  click("newEntry");
  click("pickStart");
  assert.equal(
    (el("datePickerDialog") as unknown as HTMLDialogElement).open,
    true,
  );
  click("applyDate");
  click("pickEnd");
  click("clearEndDate");
  assert.equal(el("endedAt").value, "");
  value("habit", "Coca-Cola");
  value("occurredAt", "2026-10-10T10:00");
  value("endedAt", "2026-10-10T11:00");
  submit("entryForm");
  assert.equal(
    JSON.parse(w.localStorage.getItem("ritmo-relapses-v1")!).length,
    1,
  );
  click("newEntry");
  click("modeClass");
  assert.equal(el("habit").required, false);
  assert.equal(el("subcategory").disabled, true);
  value("category", "apps");
  assert.equal(el("subcategory").disabled, false);
  assert.ok(el("subcategoryOptions").innerHTML.includes("Instagram"));
  value("category", "Apps");
  value("subcategory", "Instagram");
  value("occurredAt", "2026-10-10T12:00");
  submit("entryForm");
  assert.equal(
    JSON.parse(w.localStorage.getItem("ritmo-relapses-v1")!).length,
    2,
  );
  w.document
    .querySelector<HTMLButtonElement>('[data-action="details"]')!
    .click();
  w.document.getElementById("editDetails")!.click();
  assert.equal(el("category").value, "Apps");
  assert.ok(el("subcategoryOptions").innerHTML.includes("Instagram"));
  value("comment", "Editado");
  submit("entryForm");
  assert.equal(
    JSON.parse(w.localStorage.getItem("ritmo-relapses-v1")!)[0].comment,
    "Editado",
  );
  w.document
    .querySelector<HTMLAnchorElement>('[data-view="calendar"]')!
    .click();
  assert.equal(el("calendarView").hidden, false);
  assert.ok(w.document.querySelectorAll("[data-day]").length >= 28);
  click("prevMonth");
  click("nextMonth");
  w.document.querySelector<HTMLAnchorElement>('[data-view="stats"]')!.click();
  assert.equal(w.document.querySelectorAll("[data-stats-day]").length, 7);
  click("prevWeek");
  click("thisWeek");
  value("statsPeriod", "month");
  el("statsPeriod").dispatchEvent(new w.Event("change"));
  assert.ok(w.document.querySelectorAll("[data-stats-day]").length >= 28);
  assert.equal(el("thisWeek").textContent, "Este mes");
  value("statsPeriod", "year");
  el("statsPeriod").dispatchEvent(new w.Event("change"));
  assert.equal(w.document.querySelectorAll("[data-stats-day]").length, 12);
  click("nextWeek");
  click("thisWeek");
  value("statsPeriod", "week");
  el("statsPeriod").dispatchEvent(new w.Event("change"));
  assert.equal(w.document.querySelectorAll("[data-stats-day]").length, 7);
  click("themeToggle");
  assert.equal(w.document.documentElement.dataset.theme, "dark");
  click("sidebarToggle");
  assert.equal(w.document.body.classList.contains("menu-collapsed"), true);
  click("sidebarToggle");
  value("search", "inexistente");
  assert.equal(w.document.querySelectorAll("#entries .record-card").length, 0);
  value("search", "");
  w.document
    .querySelector<HTMLButtonElement>('[data-action="details"]')!
    .click();
  w.document.getElementById("deleteDetails")!.click();
  assert.equal(
    JSON.parse(w.localStorage.getItem("ritmo-relapses-v1")!).length,
    1,
  );
  mobile = true;
  listeners.forEach((f) => f());
  click("mobileLogo");
  assert.equal(w.document.body.classList.contains("mobile-menu-open"), true);
  click("menuBackdrop");
  assert.equal(w.document.body.classList.contains("mobile-menu-open"), false);
  click("newEntry");
  click("modeClass");
  value("category", "Apps");
  value("subcategory", "Facebook");
  value("category", "Otra clase");
  assert.equal(el("subcategory").disabled, true);
  assert.equal(el("subcategory").value, "");
  click("modeHabit");
  value("habit", "Caminar");
  click("saveTypedHabit");
  assert.deepEqual(
    JSON.parse(w.localStorage.getItem("ritmo-habit-groups-v1")!).caminar,
    { category: "", subcategory: "" },
  );
  click("close");
  click("newEntry");
  click("modeApp");
  assert.equal(el("habit").disabled, true);
  assert.equal(el("category").disabled, true);
  assert.equal(el("mobileApp").required, true);
  value("mobileApp", "Instagram");
  assert.equal(el("entryDates").hidden, true);
  assert.equal(el("appHours").required, true);
  assert.equal(el("appUsageDateField").hidden, false);
  click("pickAppDate");
  assert.equal(el("datePickerTitle").textContent, "Fecha de uso");
  assert.equal(el("datePickerTime").hidden, true);
  assert.equal(el("appDurationField").closest("dialog")?.id, "datePickerDialog");
  value("appHours", "1");
  value("appMinutes", "30");
  click("applyDate");
  value("appUsageDate", "2026-10-10");
  value("appHours", "1");
  value("appMinutes", "30");
  submit("entryForm");
  const appRecord = JSON.parse(w.localStorage.getItem("ritmo-relapses-v1")!)[0];
  assert.equal(appRecord.type, "app");
  assert.equal(appRecord.durationMinutes, 90);
  assert.equal(appRecord.occurredAt, "2026-10-10T00:00");
  assert.equal(appRecord.endedAt, "");
  assert.equal(appRecord.category, "Apps");
  assert.equal(appRecord.subcategory, "Instagram");
  w.document.querySelector<HTMLButtonElement>(`[data-id="${appRecord.id}"] [data-action="details"]`)!.click();
  click("editDetails");
  assert.equal(el("modeApp").getAttribute("aria-pressed"), "true");
  assert.equal(el("mobileApp").value, "Instagram");
  assert.equal(el("appUsageDate").value, "2026-10-10");
  assert.equal(el("appHours").value, "1");
  assert.equal(el("appMinutes").value, "30");
  click("close");
  assert.deepEqual(errors, []);
  w.close();
});
