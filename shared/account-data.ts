export const ACCOUNT_KEYS = [
  "ritmo-relapses-v1",
  "ritmo-habits-v1",
  "ritmo-habit-groups-v1",
  "ritmo-classes-v1",
  "ritmo-tracker-v1",
] as const;
export type AccountKey = (typeof ACCOUNT_KEYS)[number];
export type AccountData = Partial<Record<AccountKey, string>>;
export function validAccountValue(
  key: string,
  value: unknown,
): value is string {
  if (
    !ACCOUNT_KEYS.includes(key as AccountKey) ||
    typeof value !== "string" ||
    value.length > 2_000_000
  )
    return false;
  try {
    const parsed: unknown = JSON.parse(value);
    if (key === "ritmo-habits-v1")
      return (
        Array.isArray(parsed) && parsed.every((v) => typeof v === "string")
      );
    if (key === "ritmo-relapses-v1")
      return (
        Array.isArray(parsed) &&
        parsed.every(
          (v) =>
            v &&
            typeof v.habit === "string" &&
            typeof v.occurredAt === "string" &&
            Number.isFinite(new Date(v.occurredAt).getTime()) &&
            Number.isInteger(v.count) &&
            v.count > 0,
        )
      );
    if (key === "ritmo-tracker-v1")
      return (
        Array.isArray(parsed) &&
        parsed.every(
          (v) =>
            v &&
            typeof v.id === "string" &&
            typeof v.name === "string" &&
            Number.isInteger(v.goal) &&
            v.goal > 0 &&
            Array.isArray(v.checks) &&
            v.checks.every((d: unknown) => typeof d === "string"),
        )
      );
    return Boolean(
      parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed) &&
      Object.values(parsed).every(
        (v) =>
          v &&
          typeof v === "object" &&
          ("category" in v
            ? typeof v.category === "string" &&
              "subcategory" in v &&
              typeof v.subcategory === "string"
            : "name" in v &&
              typeof v.name === "string" &&
              "subclasses" in v &&
              Array.isArray(v.subclasses) &&
              v.subclasses.every((s: unknown) => typeof s === "string")),
      ),
    );
  } catch {
    return false;
  }
}
export function mergeAccountData(
  current: AccountData,
  incoming: AccountData,
): AccountData {
  const next = { ...current };
  for (const key of ACCOUNT_KEYS) {
    if (!incoming[key]) continue;
    if (!current[key]) {
      next[key] = incoming[key];
      continue;
    }
    const a = JSON.parse(current[key]!),
      b = JSON.parse(incoming[key]!);
    if (key === "ritmo-habits-v1")
      next[key] = JSON.stringify([
        ...new Map(
          [...a, ...b].map((s: string) => [
            s.trim().toLocaleLowerCase("es"),
            s,
          ]),
        ).values(),
      ]);
    else if (key === "ritmo-relapses-v1" || key === "ritmo-tracker-v1") {
      const items = new Map<string, Record<string, unknown>>(
        a.map((v: Record<string, unknown>) => [
          String(v.id || JSON.stringify(v)),
          v,
        ]),
      );
      for (const item of b) {
        const id = String(item.id || JSON.stringify(item));
        const previous = items.get(id);
        if (!previous) items.set(id, item);
        else if (key === "ritmo-tracker-v1")
          items.set(id, {
            ...previous,
            checks: [
              ...new Set([...(previous.checks as string[]), ...item.checks]),
            ],
          });
      }
      next[key] = JSON.stringify([...items.values()]);
    } else if (key === "ritmo-classes-v1") {
      const merged = { ...b, ...a };
      for (const name of Object.keys(b))
        if (a[name])
          merged[name] = {
            ...a[name],
            subclasses: [
              ...new Set([...a[name].subclasses, ...b[name].subclasses]),
            ],
          };
      next[key] = JSON.stringify(merged);
    } else next[key] = JSON.stringify({ ...b, ...a });
  }
  return next;
}
