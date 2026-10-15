import pg from "pg";
import { hashPassword } from "../auth/password.js";
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  connectionTimeoutMillis: 5000,
});
export async function initializeDatabase() {
  if (!process.env.DATABASE_URL)
    throw new Error(
      "Falta DATABASE_URL. Copia .env.example a .env y configura PostgreSQL.",
    );
  await pool.query(`CREATE TABLE IF NOT EXISTS ritmo_users (id uuid PRIMARY KEY,username text UNIQUE NOT NULL,password_hash text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
 CREATE TABLE IF NOT EXISTS ritmo_sessions (token_hash text PRIMARY KEY,user_id uuid NOT NULL REFERENCES ritmo_users(id) ON DELETE CASCADE,expires_at timestamptz NOT NULL);
 CREATE TABLE IF NOT EXISTS ritmo_account_data (user_id uuid PRIMARY KEY REFERENCES ritmo_users(id) ON DELETE CASCADE,data jsonb NOT NULL DEFAULT '{}');
 CREATE TABLE IF NOT EXISTS ritmo_imports (user_id uuid NOT NULL REFERENCES ritmo_users(id) ON DELETE CASCADE,fingerprint text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(user_id,fingerprint));`);
  const password = await hashPassword(process.env.ADMIN_PASSWORD || "123456");
  await pool.query(
    "INSERT INTO ritmo_users(id,username,password_hash) VALUES(gen_random_uuid(),$1,$2) ON CONFLICT(username) DO NOTHING",
    ["admin", password],
  );
}
