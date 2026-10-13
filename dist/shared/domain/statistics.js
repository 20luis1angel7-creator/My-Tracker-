import { dateKey } from './calendar.js';
export function durationMinutes(entry) { if (!entry.endedAt)
    return 0; return Math.max(0, (new Date(entry.endedAt).getTime() - new Date(entry.occurredAt || '').getTime()) / 60000); }
export function formatDuration(minutes) { const rounded = Math.round(minutes); return `${Math.floor(rounded / 60)} h ${rounded % 60} min`; }
export function weekStart(date) { const d = new Date(date); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return d; }
export function weekData(entries, start, metric = 'time', category = '') { return Array.from({ length: 7 }, (_, i) => { const date = new Date(start); date.setDate(date.getDate() + i); const day = dateKey(date); const records = entries.filter(e => e.occurredAt.slice(0, 10) === day && (!category || (e.category || 'Sin clase') === category)); return { day, date, records, value: records.reduce((sum, e) => sum + (metric === 'time' ? durationMinutes(e) : e.count), 0) }; }); }
export function breakdown(entries, metric = 'time') { const groups = new Map(); for (const e of entries) {
    const category = e.category || 'Sin clase', name = e.subcategory || e.habit, key = JSON.stringify([category, name]);
    const row = groups.get(key) || { category, name, value: 0, count: 0 };
    row.value += metric === 'time' ? durationMinutes(e) : e.count;
    row.count += e.count;
    groups.set(key, row);
} return [...groups.values()].sort((a, b) => b.value - a.value); }
//# sourceMappingURL=statistics.js.map