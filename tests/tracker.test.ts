import test from "node:test";
import assert from "node:assert/strict";
import { trackerSummary } from "../shared/domain/tracker.js";
test("Tracker calcula progreso y rachas sin duplicar marcas", () => {
  const h = {
    id: "a",
    name: "Leer",
    goal: 4,
    checks: ["2026-10-01", "2026-10-02", "2026-10-02", "2026-10-04"],
  };
  const stats = trackerSummary(h, new Date(2026, 9, 1), new Date(2026, 9, 4));
  assert.deepEqual(stats, {
    completed: 3,
    progress: 75,
    current: 1,
    longest: 2,
  });
});
test("Las marcas se mantienen independientes entre meses y la meta se limita a los días reales", () => {
  const h = {
    id: "a",
    name: "Leer",
    goal: 31,
    checks: ["2026-10-01", "2026-09-01"],
  };
  assert.equal(
    trackerSummary(h, new Date(2026, 8, 1), new Date(2026, 9, 1)).completed,
    1,
  );
  assert.equal(
    trackerSummary({ ...h, checks: [] }, new Date(2026, 1, 1)).progress,
    0,
  );
});
test("Resumen diario cuenta marcadas, sin marcar y porcentaje sin duplicados", async () => {
  const { trackerDailyTotals } = await import("../shared/domain/tracker.js");
  const rows = trackerDailyTotals(
    [
      { id: "a", name: "Leer", goal: 10, checks: ["2026-10-01", "2026-10-01"] },
      { id: "b", name: "Caminar", goal: 10, checks: [] },
    ],
    new Date(2026, 9, 1),
  );
  assert.equal(rows[0].marked, 1);
  assert.equal(rows[0].unmarked, 1);
  assert.equal(rows[0].percentage, 50);
  assert.equal(rows[1].marked, 0);
  assert.equal(trackerDailyTotals([], new Date(2026, 9, 1))[0].percentage, 0);
});
