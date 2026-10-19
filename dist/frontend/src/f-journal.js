import { accountStorage } from "./auth/account-storage.js";
import { dateKey } from "./lib/calendar.js";
import { F_QUESTIONS, fPeriod, fPatterns, questionError, validateFRecord, } from "../../shared/domain/f-records.js";
const KEY = "ritmo-f-records-v1";
const get = (id) => document.getElementById(id);
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
})[c] || c);
const formatDate = (value) => new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeStyle: "short",
}).format(new Date(value));
function localNow() {
    const now = new Date();
    return `${dateKey(now)}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}
let records = [], locked = false, anchor = new Date();
let kind = "relapse", editing = null;
let selectedId = null, selectedDay = "", page = 1;
try {
    const value = JSON.parse(accountStorage.getItem(KEY) || "[]");
    if (!Array.isArray(value) || value.some((r) => validateFRecord(r)))
        throw Error();
    records = value;
}
catch {
    locked = true;
    get("fMessage").textContent =
        "No se pudieron leer los datos de F. No se sobrescribirán.";
}
function persist(next) {
    if (locked)
        return false;
    try {
        accountStorage.setItem(KEY, JSON.stringify(next));
        records = next;
        render();
        return true;
    }
    catch {
        get("fMessage").textContent =
            "No se pudo guardar el registro. Tus datos anteriores se conservan.";
        return false;
    }
}
function answerControl(q, value) {
    const label = `<label for="fAnswer-${q.id}">${esc(q.label)}${q.optional ? " (opcional)" : ""}</label>`;
    if (q.type === "multi")
        return `<fieldset class="f-question f-checkboxes" id="fQuestion-${q.id}"><legend>${esc(q.label)}</legend><small>Puedes seleccionar varias opciones.</small>${q.options.map((option, i) => `<label for="fAnswer-${q.id}-${i}"><input id="fAnswer-${q.id}-${i}" name="${q.id}" type="checkbox" value="${esc(option)}" ${Array.isArray(value) && value.includes(option) ? "checked" : ""}><span>${esc(option)}</span></label>`).join("")}</fieldset>`;
    if (q.type === "scale")
        return `<div class="f-question" id="fQuestion-${q.id}">${label}<div class="f-scale"><input id="fAnswer-${q.id}" name="${q.id}" type="range" min="1" max="10" step="1" value="${typeof value === "number" ? value : 5}"><output for="fAnswer-${q.id}">${typeof value === "number" ? value : 5}/10</output></div><small>1 = mínimo · 10 = máximo</small></div>`;
    if (q.type === "text")
        return `<div class="f-question" id="fQuestion-${q.id}">${label}<textarea id="fAnswer-${q.id}" name="${q.id}" rows="3" maxlength="4000" ${q.optional ? "" : "required"}>${esc(value)}</textarea></div>`;
    return `<div class="f-question" id="fQuestion-${q.id}">${label}<select id="fAnswer-${q.id}" name="${q.id}" required><option value="">Selecciona una opción</option>${q.options.map((option) => `<option value="${esc(option)}" ${value === option ? "selected" : ""}>${esc(option)}</option>`).join("")}</select></div>`;
}
function openForm(type, record) {
    kind = type;
    editing = record?.id || null;
    get("fDialogTitle").textContent =
        `${record ? "Editar" : "Registrar"} ${type === "relapse" ? "recaída" : "superación"}`;
    get("fFormContent").innerHTML = F_QUESTIONS[type]
        .map((section, index) => `
    <section class="f-form-section">
      <h3>${esc(section.title)}</h3>
      ${index === 0 ? `<div class="f-question"><label for="fOccurredAt">Fecha y hora del registro</label><input id="fOccurredAt" type="datetime-local" value="${esc(record?.occurredAt || localNow())}" required></div>` : ""}
      ${section.questions.map((q) => answerControl(q, record?.answers[q.id])).join("")}
    </section>`)
        .join("");
    get("fFormError").textContent = "";
    get("fQuestionCount").textContent =
        `${F_QUESTIONS[type].flatMap((section) => section.questions).length} preguntas`;
    get("fDialog").scrollTop = 0;
    get("fDialog").showModal();
}
function readAnswers() {
    const answers = {};
    for (const section of F_QUESTIONS[kind])
        for (const q of section.questions) {
            if (q.type === "multi")
                answers[q.id] = [
                    ...get("fForm").querySelectorAll(`input[name="${q.id}"]:checked`),
                ].map((input) => input.value);
            else {
                const value = get(`fAnswer-${q.id}`).value;
                answers[q.id] = q.type === "scale" ? Number(value) : value.trim();
            }
        }
    return answers;
}
function validateForm() {
    const answers = readAnswers();
    for (const q of F_QUESTIONS[kind].flatMap((section) => section.questions)) {
        const error = questionError(q, answers[q.id]);
        if (error) {
            get("fFormError").textContent = `${q.label} ${error}`;
            get("fQuestion-" + q.id)
                .querySelector("input,select,textarea")
                ?.focus();
            return false;
        }
    }
    {
        const date = new Date(get("fOccurredAt").value);
        if (!Number.isFinite(date.getTime()) || date > new Date()) {
            get("fFormError").textContent =
                "Selecciona una fecha válida que no esté en el futuro.";
            return false;
        }
    }
    get("fFormError").textContent = "";
    return true;
}
get("fNewRelapse").onclick = () => openForm("relapse");
get("fNewSuccess").onclick = () => openForm("success");
get("fClose").onclick = () => get("fDialog").close();
get("fForm").addEventListener("input", (event) => {
    const input = event.target;
    if (input.type === "range")
        input.parentElement.querySelector("output").textContent =
            `${input.value}/10`;
    if (input.name === "when" && input.value === "Acaba de ocurrir")
        get("fOccurredAt").value = localNow();
});
get("fForm").onsubmit = (event) => {
    event.preventDefault();
    if (!validateForm())
        return;
    const record = {
        id: editing || crypto.randomUUID(),
        kind,
        occurredAt: get("fOccurredAt").value,
        answers: readAnswers(),
    };
    const error = validateFRecord(record);
    if (error) {
        get("fFormError").textContent = error;
        return;
    }
    if (persist(editing
        ? records.map((r) => (r.id === editing ? record : r))
        : [record, ...records])) {
        anchor = new Date(record.occurredAt);
        selectedDay = "";
        page = 1;
        render();
        get("fDialog").close();
        get("fMessage").textContent = "Registro guardado en F.";
    }
};
function renderPatterns(id, items, empty) {
    const max = Math.max(1, ...items.map(([, n]) => n));
    get(id).innerHTML = items.length
        ? items
            .map(([label, count]) => `<div class="f-pattern"><div><span>${esc(label)}</span><strong>${count}</strong></div><div class="f-pattern-track"><i style="width:${(count / max) * 100}%"></i></div></div>`)
            .join("")
        : `<p class="habit-empty">${empty}</p>`;
}
function render() {
    const period = get("fPeriod").value;
    const days = fPeriod(records, anchor, period), first = days[0].day, last = days[days.length - 1].day;
    const visible = records.filter((r) => r.occurredAt.slice(0, 10) >= first && r.occurredAt.slice(0, 10) <= last);
    const relapses = visible.filter((r) => r.kind === "relapse").length, successes = visible.length - relapses;
    get("fTotals").innerHTML =
        `<div><strong>${relapses}</strong><span>Recaídas</span></div><div><strong>${successes}</strong><span>Superaciones</span></div><div><strong>${visible.length ? Math.round((successes / visible.length) * 100) : 0}%</strong><span>Superaciones sobre registros</span></div>`;
    get("fPeriodLabel").textContent =
        period === "month"
            ? new Intl.DateTimeFormat("es", {
                month: "long",
                year: "numeric",
            }).format(anchor)
            : `${first} — ${last}`;
    const max = Math.max(1, ...days.map((d) => Math.max(d.relapse, d.success)));
    get("fChart").style.minWidth = period === "month" ? "850px" : "350px";
    get("fChart").style.gridTemplateColumns =
        `repeat(${days.length}, minmax(0, 1fr))`;
    get("fChart").innerHTML = days
        .map((d) => `<button type="button" class="f-chart-day ${selectedDay === d.day ? "selected" : ""}" data-f-day="${d.day}" aria-label="${d.day}: ${d.relapse} recaídas, ${d.success} superaciones" aria-pressed="${selectedDay === d.day}"><span class="f-bar-pair"><span class="f-bar relapse" style="height:${(d.relapse / max) * 100}%" title="${d.relapse} recaídas"></span><span class="f-bar success" style="height:${(d.success / max) * 100}%" title="${d.success} superaciones"></span></span><span>${d.date.getDate()}</span></button>`)
        .join("");
    // Cada conducta se cuenta una vez por evento; el evento completo no se duplica.
    renderPatterns("fBehaviors", fPatterns(visible, "relapse", "behaviors"), "Las conductas aparecerán al registrar una recaída.");
    renderPatterns("fStrategies", fPatterns(visible, "success", "strategy"), "Tus estrategias aparecerán al registrar una superación.");
    const history = visible
        .filter((r) => !selectedDay || r.occurredAt.startsWith(selectedDay))
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
    const pages = Math.max(1, Math.ceil(history.length / 10));
    page = Math.min(page, pages);
    get("fHistory").innerHTML = history.length
        ? history
            .slice((page - 1) * 10, page * 10)
            .map((r) => `<article class="f-history-row"><button type="button" data-f-detail="${esc(r.id)}"><span class="badge ${r.kind}">${r.kind === "relapse" ? "Recaída" : "Superación"}</span><strong>${formatDate(r.occurredAt)}</strong><small>${esc(r.kind === "relapse" ? r.answers.behaviors.join(" · ") : r.answers.urge)}</small></button></article>`)
            .join("")
        : '<p class="f-empty">No hay registros en esta selección.</p>';
    get("fFilterLabel").textContent = selectedDay
        ? `Registros del ${selectedDay}`
        : "Registros del período seleccionado";
    get("fClearDay").hidden = !selectedDay;
    get("fHistoryCount").textContent = `${history.length} registros`;
    get("fHistoryPage").textContent = `${page} / ${pages}`;
    get("fHistoryPrev").disabled = page === 1;
    get("fHistoryNext").disabled = page === pages;
}
get("fChart").onclick = (event) => {
    const button = event.target.closest("[data-f-day]");
    if (button) {
        selectedDay = button.dataset.fDay || "";
        page = 1;
        render();
    }
};
get("fClearDay").onclick = () => {
    selectedDay = "";
    page = 1;
    render();
};
function movePeriod(n) {
    const monthly = get("fPeriod").value === "month";
    anchor = monthly
        ? new Date(anchor.getFullYear(), anchor.getMonth() + n, 1)
        : new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + n * 7);
    selectedDay = "";
    page = 1;
    render();
}
get("fPrev").onclick = () => movePeriod(-1);
get("fNext").onclick = () => movePeriod(1);
get("fToday").onclick = () => {
    anchor = new Date();
    selectedDay = "";
    page = 1;
    render();
};
get("fPeriod").onchange = () => {
    selectedDay = "";
    page = 1;
    render();
};
get("fHistoryPrev").onclick = () => {
    if (page > 1) {
        page--;
        render();
    }
};
get("fHistoryNext").onclick = () => {
    page++;
    render();
};
get("fHistory").onclick = (event) => {
    const button = event.target.closest("[data-f-detail]");
    const record = records.find((r) => r.id === button?.dataset.fDetail);
    if (!record)
        return;
    selectedId = record.id;
    get("fDetailsTitle").textContent =
        record.kind === "relapse" ? "Recaída · F" : "Superación · F";
    get("fDetailsContent").innerHTML =
        `<p class="form-note">${formatDate(record.occurredAt)}</p>` +
            F_QUESTIONS[record.kind]
                .map((section) => `<section class="f-answer-section"><h3>${esc(section.title)}</h3>${section.questions
                .map((q) => {
                const answer = record.answers[q.id];
                const text = Array.isArray(answer)
                    ? answer.join(" · ")
                    : q.type === "scale"
                        ? `${answer}/10`
                        : answer || "Sin respuesta";
                return `<div><h4>${esc(q.label)}</h4><p>${esc(text)}</p></div>`;
            })
                .join("")}</section>`)
                .join("");
    get("fDetails").showModal();
};
get("fDetailsClose").onclick = () => get("fDetails").close();
get("fEdit").onclick = () => {
    const record = records.find((r) => r.id === selectedId);
    if (record) {
        get("fDetails").close();
        openForm(record.kind, record);
    }
};
get("fDelete").onclick = () => {
    if (selectedId &&
        confirm("¿Eliminar este registro de F?") &&
        persist(records.filter((r) => r.id !== selectedId)))
        get("fDetails").close();
};
render();
//# sourceMappingURL=f-journal.js.map