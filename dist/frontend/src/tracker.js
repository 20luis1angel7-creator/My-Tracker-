import { accountStorage } from "./auth/account-storage.js";
import { dateKey } from "./lib/calendar.js";
import { trackerSummary, trackerDailyTotals, } from "../../shared/domain/tracker.js";
const KEY = "ritmo-tracker-v1";
const get = (id) => document.getElementById(id);
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] || c);
let month = new Date(), habits = [], locked = false;
try {
    const raw = accountStorage.getItem(KEY);
    habits = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(habits) ||
        habits.some((h) => !h ||
            typeof h.id !== "string" ||
            typeof h.name !== "string" ||
            !Number.isInteger(h.goal) ||
            h.goal < 1 ||
            h.goal > 31 ||
            !Array.isArray(h.checks) ||
            h.checks.some((d) => typeof d !== "string")))
        throw Error();
}
catch {
    locked = true;
    get("trackerMessage").textContent =
        "No se pudieron leer los datos guardados. No se sobrescribirán.";
}
function save(next) {
    if (locked)
        return false;
    try {
        accountStorage.setItem(KEY, JSON.stringify(next));
        habits = next;
        render();
        return true;
    }
    catch {
        get("trackerMessage").textContent = "No se pudo guardar en este navegador.";
        return false;
    }
}
function render() {
    const year = month.getFullYear(), m = month.getMonth(), days = new Date(year, m + 1, 0).getDate();
    get("trackerMonth").textContent = new Intl.DateTimeFormat("es", {
        month: "long",
        year: "numeric",
    }).format(month);
    let week = "";
    for (let i = 0; i < days; i += 7)
        week += /* HTML */ `<th
      class="tracker-week week-${i / 7}"
      colspan="${Math.min(7, days - i)}"
    >
      SEMANA ${i / 7 + 1}
    </th>`;
    let header = "";
    for (let d = 1; d <= days; d++) {
        const date = new Date(year, m, d);
        header += /* HTML */ `<th class="tracker-day">
      <small
        >${new Intl.DateTimeFormat("es", { weekday: "short" }).format(date).slice(0, 2)}</small
      >${d}
    </th>`;
    }
    get("trackerTable").style.width = `${772 + days * 32}px`;
    get("trackerTable").innerHTML = /* HTML */ `<colgroup>
      <col style="width:180px" />
      <col style="width:60px" />
      ${Array.from({ length: days }, () => '<col style="width:32px">').join("")}
      <col style="width:80px" />
      <col style="width:160px" />
      <col style="width:80px" />
      <col style="width:80px" />
      <col style="width:32px" />
    </colgroup>
    <thead>
      <tr class="tracker-chart-row">
        <th colspan="2" class="tracker-section-label">PROGRESO DIARIO</th>
        <td colspan="${days}" id="trackerTopProgress"></td>
        <td colspan="5"></td>
      </tr>
      <tr>
        <th rowspan="2" class="tracker-name">HÁBITO DIARIO</th>
        <th rowspan="2">META</th>
        ${week}
        <th rowspan="2">COMPLETADOS</th>
        <th rowspan="2">PROGRESO</th>
        <th rowspan="2">RACHA ACTUAL</th>
        <th rowspan="2">MEJOR RACHA</th>
        <th rowspan="2"></th>
      </tr>
      <tr>
        ${header}
      </tr>
    </thead>
    <tbody>
      ${habits
        .map((h) => {
        const stats = trackerSummary(h, month);
        return /* HTML */ `<tr data-tracker-id="${esc(h.id)}">
            <th class="tracker-name">${esc(h.name)}</th>
            <td>
              <input
                class="tracker-goal"
                type="number"
                min="1"
                max="31"
                value="${h.goal}"
                aria-label="Meta de ${esc(h.name)}"
              />
            </td>
            ${Array.from({ length: days }, (_, i) => {
            const key = dateKey(new Date(year, m, i + 1)), future = key > dateKey(new Date());
            return /* HTML */ `<td>
                <input
                  type="checkbox"
                  data-check-day="${key}"
                  ${h.checks.includes(key) ? "checked" : ""}
                  ${future || locked ? "disabled" : ""}
                  aria-label="${esc(h.name)}, ${key}"
                />
              </td>`;
        }).join("")}
            <td>${stats.completed}</td>
            <td class="tracker-progress">
              <div><span style="width:${stats.progress}%"></span></div>
              <small>${stats.progress}%</small>
            </td>
            <td>${stats.current}</td>
            <td>${stats.longest}</td>
            <td>
              <button
                type="button"
                data-remove-tracker
                aria-label="Eliminar ${esc(h.name)}"
              >
                ×
              </button>
            </td>
          </tr>`;
    })
        .join("")}
    </tbody>
    <tfoot id="trackerBottomProgress"></tfoot>`;
    get("trackerEmpty").hidden = habits.length > 0;
    renderProgressCharts();
}
get("trackerForm").onsubmit = (e) => {
    e.preventDefault();
    const input = get("trackerName"), goal = get("trackerGoal"), name = input.value.trim(), number = Number(goal.value);
    if (!name || !Number.isInteger(number) || number < 1 || number > 31)
        return;
    if (habits.some((h) => h.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
        get("trackerMessage").textContent = "Ese hábito ya está en el tracker.";
        return;
    }
    if (save([
        ...habits,
        { id: crypto.randomUUID(), name, goal: number, checks: [] },
    ])) {
        input.value = "";
        get("trackerMessage").textContent = "Hábito añadido.";
    }
};
get("trackerTable").addEventListener("change", (e) => {
    const input = e.target, id = input.closest("[data-tracker-id]")?.dataset.trackerId;
    const habit = habits.find((h) => h.id === id);
    if (!habit)
        return;
    let updated;
    if (input.dataset.checkDay) {
        const day = input.dataset.checkDay;
        updated = {
            ...habit,
            checks: input.checked
                ? [...new Set([...habit.checks, day])]
                : habit.checks.filter((d) => d !== day),
        };
    }
    else {
        const goal = Number(input.value);
        if (!Number.isInteger(goal) || goal < 1 || goal > 31) {
            render();
            return;
        }
        updated = { ...habit, goal };
    }
    if (!save(habits.map((h) => (h.id === id ? updated : h))))
        render();
});
get("trackerTable").onclick = (e) => {
    const button = e.target.closest("[data-remove-tracker]");
    if (!button)
        return;
    const id = button.closest("[data-tracker-id]")?.dataset.trackerId;
    if (confirm("¿Eliminar este hábito y sus marcas del tracker?"))
        save(habits.filter((h) => h.id !== id));
};
function move(n) {
    month = new Date(month.getFullYear(), month.getMonth() + n, 1);
    render();
}
get("trackerPrev").onclick = () => move(-1);
get("trackerNext").onclick = () => move(1);
get("trackerToday").onclick = () => {
    month = new Date();
    render();
};
render();
function renderProgressCharts() {
    const totals = trackerDailyTotals(habits, month);
    get("trackerTopProgress").innerHTML = /* HTML */ `<div
    class="tracker-daily-bars"
    style="grid-template-columns:repeat(${totals.length},32px)"
  >
    ${totals
        .map((d) => /* HTML */ `<div
            class="tracker-total-column"
            data-progress-day="${d.date}"
            title="Día ${d.day}: ${d.marked} marcadas · ${d.percentage}%"
          >
            <span>${d.percentage}%</span>
            <div><i style="height:${d.percentage}%"></i></div>
          </div>`)
        .join("")}
  </div>`;
    get("trackerBottomProgress").innerHTML = /* HTML */ `<tr>
      <th colspan="2">DÍA</th>
      ${totals.map((d) => /* HTML */ `<th>${d.day}</th>`).join("")}
      <td colspan="5"></td>
    </tr>
    <tr>
      <th colspan="2">MARCADAS</th>
      ${totals.map((d) => /* HTML */ `<td data-marked="${d.date}">${d.marked}</td>`).join("")}
      <td colspan="5"></td>
    </tr>
    <tr>
      <th colspan="2">SIN MARCAR</th>
      ${totals.map((d) => /* HTML */ `<td>${d.unmarked}</td>`).join("")}
      <td colspan="5"></td>
    </tr>
    <tr>
      <th colspan="2">PORCENTAJE</th>
      ${totals.map((d) => /* HTML */ `<td>${d.percentage}%</td>`).join("")}
      <td colspan="5"></td>
    </tr>`;
}
//# sourceMappingURL=tracker.js.map