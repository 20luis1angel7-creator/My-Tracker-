import { dateKey } from "./lib/calendar.js";
const element = (id) => document.getElementById(id);
const field = (id) => element(id);
const dialog = element("datePickerDialog");
let target = "occurredAt";
let selected = new Date();
let month = new Date();
const pad = (value) => String(value).padStart(2, "0");
export function syncDateFields() {
    for (const [id, label] of [
        ["occurredAt", "startDateText"],
        ["endedAt", "endDateText"],
    ]) {
        const value = field(id).value;
        element(label).textContent = value
            ? new Intl.DateTimeFormat("es", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hourCycle: "h23",
            }).format(new Date(value))
            : id === "endedAt"
                ? "Sin fecha final"
                : "Seleccionar fecha y hora";
    }
}
function renderCalendar() {
    const y = month.getFullYear(), m = month.getMonth();
    element("dateMonth").textContent = new Intl.DateTimeFormat("es", {
        month: "long",
        year: "numeric",
    }).format(month);
    const offset = (new Date(y, m, 1).getDay() + 6) % 7;
    let html = '<span aria-hidden="true"></span>'.repeat(offset);
    for (let day = 1; day <= new Date(y, m + 1, 0).getDate(); day++) {
        const date = new Date(y, m, day), key = dateKey(date);
        const min = target === "endedAt" ? field("occurredAt").value.slice(0, 10) : "";
        const disabled = key > dateKey(new Date()) || Boolean(min && key < min);
        html += `<button type="button" data-picker-day="${key}" class="${key === dateKey(selected) ? "selected" : ""} ${key === dateKey(new Date()) ? "today" : ""}" aria-pressed="${key === dateKey(selected)}" aria-label="${key}" ${disabled ? "disabled" : ""}>${day}</button>`;
    }
    element("dateDays").innerHTML = html;
}
function syncTime() {
    field("dateHour").value = pad(selected.getHours());
    field("dateMinute").value = pad(selected.getMinutes());
}
function openPicker(id) {
    target = id;
    selected = new Date(field(id).value ||
        (id === "endedAt" ? field("occurredAt").value : "") ||
        new Date());
    month = new Date(selected.getFullYear(), selected.getMonth(), 1);
    element("datePickerTitle").textContent =
        id === "endedAt" ? "Fecha final" : "Fecha de inicio";
    element("clearEndDate").hidden = id !== "endedAt";
    element("datePickerError").textContent = "";
    syncTime();
    renderCalendar();
    dialog.showModal();
}
for (const [id, count] of [
    ["dateHour", 24],
    ["dateMinute", 60],
]) {
    field(id).innerHTML = Array.from({ length: count }, (_, i) => `<option value="${pad(i)}">${pad(i)}</option>`).join("");
}
element("pickStart").onclick = () => openPicker("occurredAt");
element("pickEnd").onclick = () => openPicker("endedAt");
element("closeDatePicker").onclick = () => dialog.close();
element("datePrev").onclick = () => {
    month = new Date(month.getFullYear(), month.getMonth() - 1, 1);
    renderCalendar();
};
element("dateNext").onclick = () => {
    month = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    renderCalendar();
};
element("dateDays").onclick = (event) => {
    const button = event.target.closest("[data-picker-day]");
    if (!button || button.disabled)
        return;
    selected = new Date(button.dataset.pickerDay + "T12:00:00");
    element("datePickerError").textContent = "";
    renderCalendar();
};
element("dateNow").onclick = () => {
    selected = new Date();
    month = new Date(selected.getFullYear(), selected.getMonth(), 1);
    syncTime();
    renderCalendar();
};
element("clearEndDate").onclick = () => {
    field("endedAt").value = "";
    syncDateFields();
    dialog.close();
};
element("applyDate").onclick = () => {
    const value = `${dateKey(selected)}T${field("dateHour").value}:${field("dateMinute").value}`;
    const start = field("occurredAt").value, end = field("endedAt").value;
    const error = new Date(value) > new Date()
        ? "La fecha no puede estar en el futuro."
        : target === "endedAt" && start && value < start
            ? "El final no puede ser anterior al inicio."
            : target === "occurredAt" && end && value > end
                ? "El inicio no puede ser posterior al final."
                : "";
    if (error) {
        element("datePickerError").textContent = error;
        return;
    }
    field(target).value = value;
    syncDateFields();
    dialog.close();
};
//# sourceMappingURL=date-picker.js.map