import test from "node:test";
import assert from "node:assert/strict";
import {
  F_QUESTIONS,
  fPeriod,
  fPatterns,
  validateFRecord,
  type FKind,
  type FRecord,
} from "../shared/domain/f-records.js";
import { validAccountValue, mergeAccountData } from "../shared/account-data.js";
function record(kind: FKind): FRecord {
  const answers: FRecord["answers"] = {};
  for (const section of F_QUESTIONS[kind])
    for (const q of section.questions)
      answers[q.id] =
        q.type === "multi"
          ? q.options!.slice(0, 2)
          : q.type === "scale"
            ? 7
            : q.type === "select"
              ? q.options![0]
              : "Mi respuesta";
  return { id: kind, kind, occurredAt: "2026-10-10T12:00", answers };
}
test("Incluye las 18 preguntas de recaída y las 11 de superación", () => {
  assert.equal(F_QUESTIONS.relapse.flatMap((s) => s.questions).length, 18);
  assert.equal(F_QUESTIONS.success.flatMap((s) => s.questions).length, 11);
  assert.equal(validateFRecord(record("relapse")), null);
  assert.equal(validateFRecord(record("success")), null);
});
test("Varias conductas se cuentan por separado sin duplicar el evento", () => {
  const records = [record("relapse"), record("success")];
  const day = fPeriod(records, new Date(2026, 9, 10), "month")[9];
  assert.equal(day.relapse, 1);
  assert.equal(day.success, 1);
  const behaviors = fPatterns(records, "relapse", "behaviors");
  assert.equal(behaviors.length, 2);
  assert.equal(behaviors[0][1], 1);
});
test("Valida escalas, fecha, respuestas y persistencia aislada en la cuenta", () => {
  const item = record("relapse");
  item.answers.intensity = 11;
  assert.ok(validateFRecord(item));
  item.answers.intensity = 7;
  item.answers.behaviors = [];
  assert.ok(validateFRecord(item));
  assert.equal(
    validAccountValue(
      "ritmo-f-records-v1",
      JSON.stringify([record("success")]),
    ),
    true,
  );
  assert.equal(
    validAccountValue("ritmo-f-records-v1", '[{"id":"bad"}]'),
    false,
  );
  const snapshot = {
    "ritmo-f-records-v1": JSON.stringify([record("success")]),
  };
  assert.equal(
    JSON.parse(mergeAccountData(snapshot, snapshot)["ritmo-f-records-v1"]!)
      .length,
    1,
  );
});
