import { dateKey } from './calendar.js';
export function trackerSummary(habit, month, today = new Date()) {
    const prefix = dateKey(month).slice(0, 7);
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const completed = new Set(habit.checks.filter(d => d.startsWith(prefix))).size;
    let longest = 0, run = 0;
    for (let day = 1; day <= days; day++) {
        if (habit.checks.includes(dateKey(new Date(month.getFullYear(), month.getMonth(), day)))) {
            run++;
            longest = Math.max(longest, run);
        }
        else
            run = 0;
    }
    const end = new Date(Math.min(new Date(month.getFullYear(), month.getMonth() + 1, 0).getTime(), new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()));
    let current = 0;
    if (end.getFullYear() === month.getFullYear() && end.getMonth() === month.getMonth()) {
        if (!habit.checks.includes(dateKey(end)))
            end.setDate(end.getDate() - 1);
        while (end.getMonth() === month.getMonth() && end.getFullYear() === month.getFullYear() && habit.checks.includes(dateKey(end))) {
            current++;
            end.setDate(end.getDate() - 1);
        }
    }
    return { completed, progress: Math.min(100, Math.round(completed / Math.min(habit.goal, days) * 100)), current, longest };
}
//# sourceMappingURL=tracker.js.map