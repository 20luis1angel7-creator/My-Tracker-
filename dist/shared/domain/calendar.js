export function dateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function eventsForDay(day, entries) {
    return entries
        .filter((e) => e.occurredAt.slice(0, 10) === day)
        .map((e) => ({
        id: e.id,
        name: e.habit,
        category: e.category,
        subcategory: e.subcategory,
        count: e.count,
        description: e.description,
        comment: e.comment,
        occurredAt: e.occurredAt,
        endedAt: e.endedAt || "",
        kind: "Recaída",
    }));
}
//# sourceMappingURL=calendar.js.map