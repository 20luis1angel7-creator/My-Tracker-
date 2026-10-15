import test from "node:test";
import assert from "node:assert/strict";
import { eventsForDay, dateKey } from "../shared/domain/calendar.js";
import { validateEntry } from "../shared/domain/model.js";
const entry = {
    habit: "Coca-Cola",
    count: 2,
    occurredAt: "2026-10-10T10:00",
    endedAt: "",
    description: "",
    comment: "",
  },
  now = new Date("2026-10-11T15:00");
test("Las fechas pertenecen a las recaídas y el final es opcional", () => {
  assert.equal(validateEntry(entry, now), null);
  assert.ok(validateEntry({ ...entry, endedAt: "2026-10-09T10:00" }, now));
  assert.equal(
    validateEntry({ ...entry, endedAt: "2026-10-10T11:00" }, now),
    null,
  );
});
test("Una recaída con ambas fechas aparece una sola vez en su inicio", () => {
  const e = { ...entry, endedAt: "2026-10-11T10:00" };
  const events = eventsForDay("2026-10-10", [e]);
  assert.equal(events.length, 1);
  assert.equal(events[0].occurredAt, e.occurredAt);
  assert.equal(events[0].endedAt, e.endedAt);
  assert.equal(eventsForDay("2026-10-11", [e]).length, 0);
});
test("Inicio y final en el mismo día no duplican el registro", () =>
  assert.equal(
    eventsForDay("2026-10-10", [{ ...entry, endedAt: "2026-10-10T11:00" }])
      .length,
    1,
  ));
test("Dos recaídas distintas del mismo hábito siguen siendo dos registros", () =>
  assert.equal(
    eventsForDay("2026-10-10", [
      { ...entry, id: "a" },
      { ...entry, id: "b" },
    ]).length,
    2,
  ));
test("Las fechas del calendario mantienen el día local", () =>
  assert.equal(dateKey(new Date(2026, 9, 11)), "2026-10-11"));
