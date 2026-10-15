import test from "node:test";
import assert from "node:assert/strict";
import { mergeAccountData, validAccountValue } from "../shared/account-data.js";
test("Importación conserva registros y marcas existentes sin duplicarlos", () => {
  const old = {
    "ritmo-relapses-v1": JSON.stringify([
      {
        id: "a",
        habit: "Leer",
        count: 1,
        occurredAt: "2026-10-01",
        comment: "Editado",
      },
    ]),
    "ritmo-tracker-v1": JSON.stringify([
      { id: "t", name: "Leer", goal: 10, checks: ["2026-10-01"] },
    ]),
  };
  const incoming = {
    "ritmo-relapses-v1": JSON.stringify([
      {
        id: "a",
        habit: "Leer",
        count: 1,
        occurredAt: "2026-10-01",
        comment: "Anterior",
      },
      { id: "b", habit: "Apps", count: 1, occurredAt: "2026-10-02" },
    ]),
    "ritmo-tracker-v1": JSON.stringify([
      { id: "t", name: "Leer", goal: 10, checks: ["2026-10-02"] },
    ]),
  };
  const result = mergeAccountData(old, incoming);
  assert.equal(JSON.parse(result["ritmo-relapses-v1"]!).length, 2);
  assert.equal(JSON.parse(result["ritmo-relapses-v1"]!)[0].comment, "Editado");
  assert.deepEqual(JSON.parse(result["ritmo-tracker-v1"]!)[0].checks, [
    "2026-10-01",
    "2026-10-02",
  ]);
  assert.deepEqual(mergeAccountData(result, incoming), result);
});
test("Los datos de importación se validan antes de guardarse", () => {
  assert.equal(validAccountValue("ritmo-habits-v1", '["Leer"]'), true);
  assert.equal(validAccountValue("ritmo-habits-v1", "[7]"), false);
  assert.equal(validAccountValue("otra-clave", "[]"), false);
  assert.equal(validAccountValue("ritmo-classes-v1", "null"), false);
});
