import { randomBytes, createHash } from "node:crypto";
import { pool } from "../db/database.js";
import { hashPassword, verifyPassword } from "./password.js";
import {
  ACCOUNT_KEYS,
  validAccountValue,
  mergeAccountData,
  type AccountData,
  type AccountKey,
} from "../../../shared/account-data.js";
const digest = (s: string) => createHash("sha256").update(s).digest("hex");
const failed = new Map<string, { count: number; until: number }>();
const json = (
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
) =>
  Response.json(body, {
    status,
    headers: { "cache-control": "no-store", ...headers },
  });
function cookie(value: string, clear = false) {
  return `ritmo_session=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${clear ? 0 : 604800}${process.env.COOKIE_SECURE === "true" ? "; Secure" : ""}`;
}
export async function handleAccountRoutes(
  request: Request,
): Promise<Response | null> {
  const url = new URL(request.url),
    path = url.pathname;
  if (!path.startsWith("/api/auth/") && !path.startsWith("/api/data"))
    return null;
  if (
    request.method !== "GET" &&
    request.headers.get("origin") &&
    request.headers.get("origin") !== url.origin
  )
    return json({ error: "Origen no permitido" }, 403);
  const token = request.headers
    .get("cookie")
    ?.match(/(?:^|;\s*)ritmo_session=([^;]+)/)?.[1];
  const session = token
    ? (
        await pool.query(
          "SELECT u.id,u.username FROM ritmo_sessions s JOIN ritmo_users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now()",
          [digest(token)],
        )
      ).rows[0]
    : null;
  if (path === "/api/auth/me" && request.method === "GET")
    return session ? json({ user: session }) : json({ user: null }, 401);
  let body: Record<string, unknown> = {};
  if (request.method !== "GET")
    try {
      body = await request.json();
      if (!body || typeof body !== "object" || Array.isArray(body))
        throw Error();
    } catch {
      return json({ error: "JSON inválido" }, 400);
    }
  if (
    (path === "/api/auth/login" || path === "/api/auth/register") &&
    request.method === "POST"
  ) {
    const username =
        typeof body.username === "string"
          ? body.username.trim().toLowerCase()
          : "",
      password = typeof body.password === "string" ? body.password : "";
    if (
      !/^[a-z0-9_.-]{3,32}$/.test(username) ||
      password.length < 6 ||
      password.length > 128
    )
      return json(
        {
          error:
            "Usa un usuario de 3–32 caracteres y una contraseña de 6–128 caracteres.",
        },
        400,
      );
    const attempt = failed.get(username);
    if (attempt && attempt.until > Date.now() && attempt.count >= 10)
      return json({ error: "Demasiados intentos. Espera 15 minutos." }, 429);
    let user;
    if (path.endsWith("register")) {
      try {
        user = (
          await pool.query(
            "INSERT INTO ritmo_users(id,username,password_hash) VALUES(gen_random_uuid(),$1,$2) RETURNING id,username",
            [username, await hashPassword(password)],
          )
        ).rows[0];
      } catch (e) {
        if ((e as { code?: string }).code === "23505")
          return json({ error: "Ese usuario ya existe." }, 409);
        throw e;
      }
    } else {
      user = (
        await pool.query(
          "SELECT id,username,password_hash FROM ritmo_users WHERE username=$1",
          [username],
        )
      ).rows[0];
      const valid = await verifyPassword(
        password,
        user?.password_hash || (await hashPassword("unavailable")),
      );
      if (!user || !valid) {
        failed.set(username, {
          count: attempt && attempt.until > Date.now() ? attempt.count + 1 : 1,
          until: Date.now() + 900000,
        });
        return json({ error: "Usuario o contraseña incorrectos." }, 401);
      }
    }
    failed.delete(username);
    const value = randomBytes(32).toString("hex");
    await pool.query(
      "INSERT INTO ritmo_sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '7 days')",
      [digest(value), user.id],
    );
    return json({ user: { id: user.id, username: user.username } }, 200, {
      "set-cookie": cookie(value),
    });
  }
  if (!session)
    return json({ error: "Inicia sesión para acceder a tus datos." }, 401);
  if (path === "/api/auth/logout" && request.method === "POST") {
    await pool.query("DELETE FROM ritmo_sessions WHERE token_hash=$1", [
      digest(token!),
    ]);
    return json({ ok: true }, 200, { "set-cookie": cookie("", true) });
  }
  if (path === "/api/data" && request.method === "GET") {
    const result = await pool.query(
      "SELECT data FROM ritmo_account_data WHERE user_id=$1",
      [session.id],
    );
    return json({ data: result.rows[0]?.data || {} });
  }
  if (path === "/api/data/import" && request.method === "POST") {
    if (session.username !== "admin")
      return json(
        { error: "Los datos anteriores se importan solo en admin." },
        403,
      );
    const incoming = body.data as AccountData;
    if (
      !incoming ||
      typeof incoming !== "object" ||
      Object.entries(incoming).some(([k, v]) => !validAccountValue(k, v))
    )
      return json(
        { error: "Copia de datos inválida; no se modificaron los datos." },
        400,
      );
    const fingerprint = digest(
      JSON.stringify(ACCOUNT_KEYS.map((k) => [k, incoming[k] || null])),
    );
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "INSERT INTO ritmo_account_data(user_id) VALUES($1) ON CONFLICT DO NOTHING",
        [session.id],
      );
      const current = (
        await client.query(
          "SELECT data FROM ritmo_account_data WHERE user_id=$1 FOR UPDATE",
          [session.id],
        )
      ).rows[0].data;
      const imported = await client.query(
        "INSERT INTO ritmo_imports(user_id,fingerprint) VALUES($1,$2) ON CONFLICT DO NOTHING RETURNING fingerprint",
        [session.id, fingerprint],
      );
      const data = imported.rowCount
        ? mergeAccountData(current, incoming)
        : current;
      if (imported.rowCount)
        await client.query(
          "UPDATE ritmo_account_data SET data=$2 WHERE user_id=$1",
          [session.id, JSON.stringify(data)],
        );
      await client.query("COMMIT");
      return json({ data, imported: Boolean(imported.rowCount) });
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }
  if (path === "/api/data" && request.method === "PUT") {
    const key = body.key as AccountKey,
      value = body.value;
    if (!validAccountValue(key, value))
      return json({ error: "Datos inválidos" }, 400);
    await pool.query(
      "INSERT INTO ritmo_account_data(user_id,data) VALUES($1,jsonb_build_object($2::text,$3::text)) ON CONFLICT(user_id) DO UPDATE SET data=ritmo_account_data.data||EXCLUDED.data",
      [session.id, key, value],
    );
    return json({ ok: true });
  }
  return json({ error: "Ruta no encontrada" }, 404);
}
