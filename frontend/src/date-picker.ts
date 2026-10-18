import { dateKey } from "./lib/calendar.js";
const element = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const field = (id: string) => element<HTMLInputElement>(id);
const dialog = element<HTMLDialogElement>("datePickerDialog");
let target: "occurredAt" | "endedAt" | "appUsageDate" = "occurredAt";
let durationSnapshot: { hours: string; minutes: string } | null = null;
let selected = new Date();
let month = new Date();
const pad = (value: number) => String(value).padStart(2, "0");

export function syncDateFields() {
  for (const [id, label] of [
    ["occurredAt", "startDateText"],
    ["endedAt", "endDateText"],
    ["appUsageDate", "appDateText"],
  ]) {
    const value = field(id).value;
    element(label).textContent = value
      ? new Intl.DateTimeFormat("es", {
          day: "numeric",
          month: "short",
          year: "numeric",
          ...(id === "appUsageDate" ? {} : {
            hour: "2-digit" as const,
            minute: "2-digit" as const,
            hour12: true,
          }),
        }).format(new Date(id === "appUsageDate" ? value + "T12:00:00" : value))
      : id === "endedAt"
        ? "Sin fecha final"
        : "Seleccionar fecha y hora";
  }
}
function renderCalendar() {
  const y = month.getFullYear(),
    m = month.getMonth();
  element("dateMonth").textContent = new Intl.DateTimeFormat("es", {
    month: "long",
    year: "numeric",
  }).format(month);
  const offset = (new Date(y, m, 1).getDay() + 6) % 7;
  let html = '<span aria-hidden="true"></span>'.repeat(offset);
  for (let day = 1; day <= new Date(y, m + 1, 0).getDate(); day++) {
    const date = new Date(y, m, day),
      key = dateKey(date);
    const min =
      target === "endedAt" ? field("occurredAt").value.slice(0, 10) : "";
    const disabled = key > dateKey(new Date()) || Boolean(min && key < min);
    html += `<button type="button" data-picker-day="${key}" class="${key === dateKey(selected) ? "selected" : ""} ${key === dateKey(new Date()) ? "today" : ""}" aria-pressed="${key === dateKey(selected)}" aria-label="${key}" ${disabled ? "disabled" : ""}>${day}</button>`;
  }
  element("dateDays").innerHTML = html;
}
function syncTime() {
  field("dateHour").value = pad(selected.getHours() % 12 || 12);
  field("dateMinute").value = pad(selected.getMinutes());
  field("datePeriod").value = selected.getHours() >= 12 ? "PM" : "AM";
}
function openPicker(id: typeof target) {
  target = id;
  durationSnapshot = id === "appUsageDate"
    ? { hours: field("appHours").value, minutes: field("appMinutes").value }
    : null;
  element("appDurationField").hidden = id !== "appUsageDate";
  selected = new Date(
    (id === "appUsageDate" && field(id).value
      ? field(id).value + "T12:00:00" : field(id).value) ||
      (id === "endedAt" ? field("occurredAt").value : "") ||
      new Date(),
  );
  month = new Date(selected.getFullYear(), selected.getMonth(), 1);
  element("datePickerTitle").textContent =
    id === "appUsageDate" ? "Fecha de uso" : id === "endedAt" ? "Fecha final" : "Fecha de inicio";
  element("datePickerTime").hidden = id === "appUsageDate";
  element("clearEndDate").hidden = id !== "endedAt";
  element("datePickerError").textContent = "";
  syncTime();
  renderCalendar();
  dialog.showModal();
}
for (const [id, count] of [
  ["dateHour", 12],
  ["dateMinute", 60],
] as const) {
  field(id).innerHTML = Array.from(
    { length: count },
    (_, i) => {
      const value = pad(id === "dateHour" ? i + 1 : i);
      return `<option value="${value}">${value}</option>`;
    },
  ).join("");
}
element("pickAppDate").onclick = () => openPicker("appUsageDate");
element("pickStart").onclick = () => openPicker("occurredAt");
element("pickEnd").onclick = () => openPicker("endedAt");
function cancelDurationSelection() {
  if (durationSnapshot) {
    field("appHours").value = durationSnapshot.hours;
    field("appMinutes").value = durationSnapshot.minutes;
    durationSnapshot = null;
  }
}
element("closeDatePicker").onclick = () => {
  cancelDurationSelection();
  dialog.close();
};
dialog.addEventListener("cancel", cancelDurationSelection);
dialog.addEventListener("close", cancelDurationSelection);
element("datePrev").onclick = () => {
  month = new Date(month.getFullYear(), month.getMonth() - 1, 1);
  renderCalendar();
};
element("dateNext").onclick = () => {
  month = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  renderCalendar();
};
element("dateDays").onclick = (event) => {
  const button = (event.target as Element).closest<HTMLButtonElement>(
    "[data-picker-day]",
  );
  if (!button || button.disabled) return;
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
  if (target === "appUsageDate") {
    const minutes = Number(field("appHours").value) * 60 + Number(field("appMinutes").value);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      element("datePickerError").textContent = "Selecciona el tiempo que usaste la app.";
      return;
    }
    const value = dateKey(selected);
    if (value > dateKey(new Date())) {
      element("datePickerError").textContent = "La fecha no puede estar en el futuro.";
      return;
    }
    field(target).value = value;
    durationSnapshot = null;
    syncDateFields();
    dialog.close();
    return;
  }
  const hour = Number(field("dateHour").value) % 12 + (field("datePeriod").value === "PM" ? 12 : 0);
  const value = `${dateKey(selected)}T${pad(hour)}:${field("dateMinute").value}`;
  const start = field("occurredAt").value,
    end = field("endedAt").value;
  const error =
    new Date(value) > new Date()
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
