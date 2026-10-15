import { ACCOUNT_KEYS, } from "../../../shared/account-data.js";
let active = false, userId = "", values = {}, pending = {}, queue = Promise.resolve(), lastError = false;
const isAccountKey = (key) => ACCOUNT_KEYS.includes(key);
function status(message, error = false) {
    const node = document.getElementById("accountSync");
    if (node) {
        node.textContent = message;
        node.classList.toggle("sync-error", error);
    }
}
function backup() {
    localStorage.setItem(`ritmo-account-backup:${userId}`, JSON.stringify(values));
    localStorage.setItem(`ritmo-account-pending:${userId}`, JSON.stringify(pending));
}
function enqueue(key, value) {
    queue = queue.then(async () => {
        try {
            const response = await fetch("/api/data", {
                method: "PUT",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ key, value }),
            });
            if (!response.ok)
                throw Error();
            if (pending[key] === value)
                delete pending[key];
            backup();
            lastError = false;
            status(Object.keys(pending).length ? "Guardando…" : "Guardado en PostgreSQL");
        }
        catch {
            lastError = true;
            status("Pendiente de guardar · pulsa Reintentar", true);
        }
    });
}
export async function activateAccount(id, data) {
    userId = id;
    values = { ...data };
    pending = JSON.parse(localStorage.getItem(`ritmo-account-pending:${id}`) || "{}");
    values = { ...values, ...pending };
    active = true;
    backup();
    for (const [key, value] of Object.entries(pending))
        enqueue(key, value);
    await queue;
    status(lastError
        ? "Pendiente de guardar · pulsa Reintentar"
        : "Guardado en PostgreSQL", lastError);
}
export async function flushAccount() {
    for (const [key, value] of Object.entries(pending))
        enqueue(key, value);
    await queue;
    return !Object.keys(pending).length;
}
export const accountStorage = {
    getItem(key) {
        if (!active || !isAccountKey(key))
            return localStorage.getItem(key);
        return values[key] ?? null;
    },
    setItem(key, value) {
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
    removeItem(key) {
        if (!active || !isAccountKey(key)) {
            localStorage.removeItem(key);
            return;
        }
        const value = key === "ritmo-relapses-v1" ||
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
//# sourceMappingURL=account-storage.js.map