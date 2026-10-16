import {
  ACCOUNT_KEYS,
  type AccountData,
} from "../../../shared/account-data.js";
import { activateAccount, flushAccount } from "./account-storage.js";
const get = (id: string) => document.getElementById(id)!;
let mode = "login";
async function api(path: string, body?: unknown) {
  const response = await fetch(
    path,
    body === undefined
      ? {}
      : {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        },
  );
  const data = await response.json();
  if (!response.ok) throw Error(data.error || "Inicia sesión para continuar.");
  return data;
}
async function enter(user: { id: string; username: string }) {
  let data: AccountData;
  if (user.username === "admin") {
    const previous: AccountData = {};
    for (const key of ACCOUNT_KEYS) {
      const value = localStorage.getItem(key);
      if (value !== null) previous[key] = value;
    }
    // Mantener una copia inmutable antes de importar. No se eliminan las claves originales.
    if (Object.keys(previous).length) {
      const backupKey = "ritmo-original-backup-v1";
      if (!localStorage.getItem(backupKey))
        localStorage.setItem(backupKey, JSON.stringify(previous));
      data = (await api("/api/data/import", { data: previous })).data;
    } else data = (await api("/api/data")).data;
  } else data = (await api("/api/data")).data;
  await activateAccount(user.id, data);
  get("accountUser").textContent = user.username;
  await import("../app.js");
  get("authView").hidden = true;
  document.body.classList.remove("auth-pending");
}
get("authSwitch").onclick = () => {
  mode = mode === "login" ? "register" : "login";
  get("authTitle").textContent =
    mode === "login" ? "Iniciar sesión" : "Crear cuenta";
  get("authSubmit").textContent = mode === "login" ? "Entrar" : "Registrarme";
  get("authSwitch").textContent =
    mode === "login" ? "Crear una cuenta" : "Ya tengo una cuenta";
  get("authError").textContent = "";
};
(get("authForm") as HTMLFormElement).onsubmit = async (e) => {
  e.preventDefault();
  const button = get("authSubmit") as HTMLButtonElement;
  button.disabled = true;
  get("authError").textContent = "";
  try {
    const result = await api(`/api/auth/${mode}`, {
      username: (get("authUsername") as HTMLInputElement).value,
      password: (get("authPassword") as HTMLInputElement).value,
    });
    await enter(result.user);
  } catch (error) {
    get("authError").textContent = (error as Error).message;
  } finally {
    button.disabled = false;
  }
};
get("logoutButton").onclick = async () => {
  if (!(await flushAccount())) {
    alert(
      "Hay cambios pendientes. Comprueba la conexión; se guardarán automáticamente antes de cerrar sesión.",
    );
    return;
  }
  try {
    await api("/api/auth/logout", {});
    location.reload();
  } catch {
    alert("No se pudo cerrar sesión. Vuelve a intentarlo.");
  }
};
try {
  const result = await api("/api/auth/me");
  await enter(result.user);
} catch (error) {
  get("authError").textContent = (error as Error).message.includes(
    "Inicia sesión",
  )
    ? ""
    : (error as Error).message;
}
