import test from "node:test";
import assert from "node:assert/strict";
import { handleApi } from "../backend/src/api.js";
test("Backend health and validation accept class without habit", async () => {
  assert.equal(
    (await handleApi(new Request("http://localhost/api/health"))).status,
    200,
  );
  const valid = await handleApi(
    new Request("http://localhost/api/entries/validate", {
      method: "POST",
      body: JSON.stringify({
        type: "class",
        category: "Apps",
        count: 1,
        occurredAt: "2026-10-10T10:00",
      }),
    }),
  );
  assert.equal(valid.status, 200);
  const invalid = await handleApi(
    new Request("http://localhost/api/entries/validate", {
      method: "POST",
      body: JSON.stringify({ habit: 45 }),
    }),
  );
  assert.equal(invalid.status, 400);
});
test("Backend statistics sums supplied records and rejects malformed JSON", async () => {
  const response = await handleApi(
    new Request("http://localhost/api/statistics", {
      method: "POST",
      body: JSON.stringify({
        date: "2026-10-12",
        metric: "count",
        entries: [
          { habit: "Instagram", count: 2, occurredAt: "2026-10-12T10:00" },
        ],
      }),
    }),
  );
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.days[0].value, 2);
  assert.equal(
    (
      await handleApi(
        new Request("http://localhost/api/statistics", {
          method: "POST",
          body: "{bad",
        }),
      )
    ).status,
    400,
  );
});
