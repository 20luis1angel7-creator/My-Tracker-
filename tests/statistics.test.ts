import test from "node:test";
import assert from "node:assert/strict";
import {
  durationMinutes,
  weekStart,
  weekData,
  breakdown,
} from "../shared/domain/statistics.js";
const entries = [
  {
    habit: "Instagram",
    category: "Apps",
    subcategory: "Instagram",
    count: 2,
    occurredAt: "2026-10-12T10:00",
    endedAt: "2026-10-12T11:30",
  },
  {
    habit: "Facebook",
    category: "Apps",
    subcategory: "Facebook",
    count: 1,
    occurredAt: "2026-10-12T12:00",
    endedAt: "",
  },
  { habit: "Coca-Cola", count: 1, occurredAt: "2026-10-13T10:00", endedAt: "" },
];
test("Tiempo usa una sola duración por registro; sin final no aporta tiempo", () => {
  assert.equal(durationMinutes(entries[0]), 90);
  assert.equal(durationMinutes(entries[1]), 0);
});
test("Semana empieza el lunes y filtra clases sin duplicar recaídas", () => {
  const start = weekStart(new Date("2026-10-14T12:00"));
  assert.equal(start.getDate(), 12);
  const days = weekData(entries, start, "count", "Apps");
  assert.equal(days[0].value, 3);
  assert.equal(days[1].value, 0);
  assert.equal(weekData(entries, start, "time")[0].value, 90);
});
test("Desglose agrupa clase y subclase y admite registros antiguos", () => {
  const rows = breakdown(entries, "count");
  assert.equal(rows.length, 3);
  assert.equal(rows.find((r) => r.name === "Coca-Cola")!.category, "Sin clase");
  assert.equal(rows.find((r) => r.name === "Instagram")!.value, 2);
});
test("Períodos mensuales respetan febrero bisiesto y el año agrupa por mes", async () => {
  const { periodData } = await import("../shared/domain/statistics.js");
  assert.equal(periodData([], new Date(2024, 1, 15), "month").length, 29);
  assert.equal(periodData([], new Date(2025, 1, 15), "month").length, 28);
  const months = periodData(entries, new Date(2026, 9, 15), "year", "count");
  assert.equal(months.length, 12);
  assert.equal(months[9].value, 4);
  assert.equal(months[8].value, 0);
});
