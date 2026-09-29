import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

export const sql = postgres(url, { max: 10, onnotice: () => {} });

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
}

export interface FeedRow {
  user_id: string;
  token: string;
  prefs: unknown;
  updated_at: Date;
  last_fetched_at: Date | null;
}

/** Idempotent schema setup; the schema is small enough not to need a migration tool yet. */
export async function migrate() {
  await sql`
    create table if not exists users (
      id uuid primary key default gen_random_uuid(),
      email text not null unique,
      password_hash text not null,
      created_at timestamptz not null default now()
    )`;
  await sql`
    create table if not exists sessions (
      id text primary key,
      user_id uuid not null references users(id) on delete cascade,
      expires_at timestamptz not null
    )`;
  await sql`create index if not exists sessions_user_idx on sessions(user_id)`;
  await sql`
    create table if not exists feeds (
      user_id uuid primary key references users(id) on delete cascade,
      token text not null unique,
      prefs jsonb not null,
      updated_at timestamptz not null default now(),
      last_fetched_at timestamptz
    )`;
}
