import {
  ACCOUNT_KEYS,
  type AccountData,
  type AccountKey,
} from "../../../shared/account-data.js";
let active = false,
  userId = "",
  values: AccountData = {},
  pending: AccountData = {},
  queue = Promise.resolve(),
  lastError = false;
const isAccountKey = (key: string): key is AccountKey =>
  ACCOUNT_KEYS.includes(key as AccountKey);
let retryTimer: number | undefined;
let retryDelay = 5000;

function status(message: string, error = false) {
  const node = document.getElementById("accountSaveNotice");
  if (node) {
    node.textContent = message;
    node.hidden = !error;
  }
}
function backup() {
  localStorage.setItem(
    `ritmo-account-backup:${userId}`,
    JSON.stringify(values),
  );
  localStorage.setItem(
    `ritmo-account-pending:${userId}`,
    JSON.stringify(pending),
  );
}
function enqueue(key: AccountKey, value: string) {
  queue = queue.then(async () => {
    try {
      const response = await fetch("/api/data", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (!response.ok) throw Error();
      if (pending[key] === value) delete pending[key];
      backup();
      lastError = false;
      retryDelay = 5000;
      if (!Object.keys(pending).length && retryTimer !== undefined) {
        window.clearTimeout(retryTimer);
        retryTimer = undefined;
      }
      status(
        Object.keys(pending).length ? "Guardando…" : "Guardado en PostgreSQL",
      );
    } catch {
      lastError = true;
      status("Hay cambios pendientes. Se guardarán automáticamente cuando vuelva la conexión.", true);
      if (retryTimer === undefined) {
        retryTimer = window.setTimeout(() => {
          retryTimer = undefined;
          void flushAccount();
        }, retryDelay);
        retryDelay = Math.min(retryDelay * 2, 60000);
      }
    }
  });
}
export async function activateAccount(id: string, data: AccountData) {
  userId = id;
  values = { ...data };
  pending = JSON.parse(
    localStorage.getItem(`ritmo-account-pending:${id}`) || "{}",
  );
  values = { ...values, ...pending };
  active = true;
  backup();
  for (const [key, value] of Object.entries(pending))
    enqueue(key as AccountKey, value!);
  await queue;
  status(
    lastError
      ? "Hay cambios pendientes. Se guardarán automáticamente cuando vuelva la conexión."
      : "Guardado en PostgreSQL",
    lastError,
  );
}
export async function flushAccount() {
  for (const [key, value] of Object.entries(pending))
    enqueue(key as AccountKey, value!);
  await queue;
  return !Object.keys(pending).length;
}
export const accountStorage = {
  getItem(key: string) {
    if (!active || !isAccountKey(key)) return localStorage.getItem(key);
    return values[key] ?? null;
  },
  setItem(key: string, value: string) {
    if (!active || !isAccountKey(key)) {
      localStorage.setItem(key, value);
      return;
    }
    values[key] = value;
    pending[key] = value;
    backup();
    status("Guardando…");
    enqueue(key, value);
  },
  removeItem(key: string) {
    if (!active || !isAccountKey(key)) {
      localStorage.removeItem(key);
      return;
    }
    const value =
      key === "ritmo-relapses-v1" ||
      key === "ritmo-habits-v1" ||
      key === "ritmo-tracker-v1"
        ? "[]"
        : "{}";
    this.setItem(key, value);
  },
};
window.addEventListener("beforeunload", (e) => {
  if (active && Object.keys(pending).length) {
    e.preventDefault();
    e.returnValue = "";
  }
});

window.addEventListener("online", () => {
  if (active && Object.keys(pending).length) void flushAccount();
});
