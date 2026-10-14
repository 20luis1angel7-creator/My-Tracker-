import { dateKey } from './lib/calendar.js';
import { trackerSummary, trackerDailyTotals } from '../../shared/domain/tracker.js';
const KEY = 'ritmo-tracker-v1';
const get = (id) => document.getElementById(id);
const esc = (s) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));
let month = new Date(), habits = [], locked = false;
try {
    const raw = localStorage.getItem(KEY);
    habits = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(habits) || habits.some(h => !h || typeof h.id !== 'string' || typeof h.name !== 'string' || !Number.isInteger(h.goal) || h.goal < 1 || h.goal > 31 || !Array.isArray(h.checks) || h.checks.some(d => typeof d !== 'string')))
        throw Error();
}
catch {
    locked = true;
    get('trackerMessage').textContent = 'No se pudieron leer los datos guardados. No se sobrescribirán.';
}
function save(next) { if (locked)
    return false; try {
    localStorage.setItem(KEY, JSON.stringify(next));
    habits = next;
    render();
    return true;
}
catch {
    get('trackerMessage').textContent = 'No se pudo guardar en este navegador.';
    return false;
} }
function render() { const year = month.getFullYear(), m = month.getMonth(), days = new Date(year, m + 1, 0).getDate(); get('trackerMonth').textContent = new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' }).format(month); let week = ''; for (let i = 0; i < days; i += 7)
    week += `<th class="tracker-week week-${i / 7}" colspan="${Math.min(7, days - i)}">SEMANA ${i / 7 + 1}</th>`; let header = ''; for (let d = 1; d <= days; d++) {
    const date = new Date(year, m, d);
    header += `<th class="tracker-day"><small>${new Intl.DateTimeFormat('es', { weekday: 'short' }).format(date).slice(0, 2)}</small>${d}</th>`;
} get('trackerTable').innerHTML = `<thead><tr><th rowspan="2" class="tracker-name">HÁBITO DIARIO</th><th rowspan="2">META</th>${week}<th rowspan="2">COMPLETADOS</th><th rowspan="2">PROGRESO</th><th rowspan="2">RACHA ACTUAL</th><th rowspan="2">MEJOR RACHA</th><th rowspan="2"></th></tr><tr>${header}</tr></thead><tbody>${habits.map(h => { const stats = trackerSummary(h, month); return `<tr data-tracker-id="${esc(h.id)}"><th class="tracker-name">${esc(h.name)}</th><td><input class="tracker-goal" type="number" min="1" max="31" value="${h.goal}" aria-label="Meta de ${esc(h.name)}"></td>${Array.from({ length: days }, (_, i) => { const key = dateKey(new Date(year, m, i + 1)), future = key > dateKey(new Date()); return `<td><input type="checkbox" data-check-day="${key}" ${h.checks.includes(key) ? 'checked' : ''} ${future || locked ? 'disabled' : ''} aria-label="${esc(h.name)}, ${key}"></td>`; }).join('')}<td>${stats.completed}</td><td class="tracker-progress"><div><span style="width:${stats.progress}%"></span></div><small>${stats.progress}%</small></td><td>${stats.current}</td><td>${stats.longest}</td><td><button type="button" data-remove-tracker aria-label="Eliminar ${esc(h.name)}">×</button></td></tr>`; }).join('')}</tbody>`; get('trackerEmpty').hidden = habits.length > 0; renderProgressCharts(); }
get('trackerForm').onsubmit = e => { e.preventDefault(); const input = get('trackerName'), goal = get('trackerGoal'), name = input.value.trim(), number = Number(goal.value); if (!name || !Number.isInteger(number) || number < 1 || number > 31)
    return; if (habits.some(h => h.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
    get('trackerMessage').textContent = 'Ese hábito ya está en el tracker.';
    return;
} if (save([...habits, { id: crypto.randomUUID(), name, goal: number, checks: [] }])) {
    input.value = '';
    get('trackerMessage').textContent = 'Hábito añadido.';
} };
get('trackerTable').addEventListener('change', e => { const input = e.target, id = input.closest('[data-tracker-id]')?.dataset.trackerId; const habit = habits.find(h => h.id === id); if (!habit)
    return; let updated; if (input.dataset.checkDay) {
    const day = input.dataset.checkDay;
    updated = { ...habit, checks: input.checked ? [...new Set([...habit.checks, day])] : habit.checks.filter(d => d !== day) };
}
else {
    const goal = Number(input.value);
    if (!Number.isInteger(goal) || goal < 1 || goal > 31) {
        render();
        return;
    }
    updated = { ...habit, goal };
} if (!save(habits.map(h => h.id === id ? updated : h)))
    render(); });
get('trackerTable').onclick = e => { const button = e.target.closest('[data-remove-tracker]'); if (!button)
    return; const id = button.closest('[data-tracker-id]')?.dataset.trackerId; if (confirm('¿Eliminar este hábito y sus marcas del tracker?'))
    save(habits.filter(h => h.id !== id)); };
function move(n) { month = new Date(month.getFullYear(), month.getMonth() + n, 1); render(); }
get('trackerPrev').onclick = () => move(-1);
get('trackerNext').onclick = () => move(1);
get('trackerToday').onclick = () => { month = new Date(); render(); };
render();
function renderProgressCharts() {
    const totals = trackerDailyTotals(habits, month);
    get('trackerTopProgress').innerHTML = `<h3>PROGRESO DIARIO</h3><div class="tracker-daily-bars" style="grid-template-columns:repeat(${totals.length},1fr)">${totals.map(d => `<div class="tracker-total-column" title="Día ${d.day}: ${d.marked} marcadas · ${d.percentage}%"><span>${d.percentage}%</span><div><i style="height:${d.percentage}%"></i></div><small>${d.day}</small></div>`).join('')}</div>`;
    const points = totals.map((d, i) => `${10 + i * 980 / (totals.length - 1)},${110 - d.percentage}`).join(' ');
    const summary = totals.reduce((n, d) => n + d.marked, 0), possible = habits.length * totals.length;
    get('trackerBottomProgress').innerHTML = `<h3>EVOLUCIÓN DEL MES <small>${summary} marcadas / ${possible} casillas · ${possible ? Math.round(summary / possible * 100) : 0}%</small></h3><svg class="tracker-area" viewBox="0 0 1000 120" preserveAspectRatio="none" role="img" aria-label="Progreso diario del mes de 0 a 100 por ciento"><path d="M10 10H990 M10 60H990 M10 110H990" stroke="#45516a" stroke-width="1" fill="none"/><polygon points="10,110 ${points} 990,110" fill="#d6c579" fill-opacity="0.35"/><polyline points="${points}" stroke="#dccb85" stroke-width="2" fill="none"/></svg><table class="tracker-daily-summary"><thead><tr><th>DÍA</th>${totals.map(d => `<th>${d.day}</th>`).join('')}</tr></thead><tbody><tr><th>MARCADAS</th>${totals.map(d => `<td data-marked="${d.date}">${d.marked}</td>`).join('')}</tr><tr><th>SIN MARCAR</th>${totals.map(d => `<td>${d.unmarked}</td>`).join('')}</tr><tr><th>PORCENTAJE</th>${totals.map(d => `<td>${d.percentage}%</td>`).join('')}</tr></tbody></table>`;
}
//# sourceMappingURL=tracker.js.map