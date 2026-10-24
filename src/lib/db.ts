import postgres from "postgres";

type Sql = postgres.Sql;
const g = globalThis as unknown as { __sql?: Sql; __ready?: Promise<void> };

export function dbConfigured(): boolean {
  return !!process.env.DATABASE_URL;
}

const SCHEMA = `
create table if not exists leads (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  type text not null,
  name text not null,
  company text, email text, phone text, country text, product text, details text,
  locale text, page text,
  status text not null default 'new',
  assignee text,
  follow_up date,
  email_sent boolean not null default false
);
create index if not exists leads_status_idx on leads (status, created_at desc);
create table if not exists lead_notes (
  id bigserial primary key,
  lead_id bigint not null references leads(id) on delete cascade,
  created_at timestamptz not null default now(),
  body text not null
);
create table if not exists content_overrides (
  locale text not null,
  path text not null,
  value text not null,
  updated_at timestamptz not null default now(),
  primary key (locale, path)
);
create table if not exists posts (
  id bigserial primary key,
  locale text not null,
  slug text not null,
  title text not null,
  excerpt text not null default '',
  body text not null default '',
  published boolean not null default false,
  published_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (locale, slug)
);
create table if not exists content_lists (
  locale text not null,
  key text not null,
  items jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (locale, key)
);
create table if not exists settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
create table if not exists pages (
  id bigserial primary key,
  locale text not null,
  slug text not null,
  title text not null,
  body text not null default '',
  seo_title text not null default '',
  seo_description text not null default '',
  cover_media bigint,
  published boolean not null default false,
  show_in_nav boolean not null default false,
  show_in_footer boolean not null default false,
  position int not null default 0,
  updated_at timestamptz not null default now(),
  unique (locale, slug)
);
create table if not exists media (
  id bigserial primary key,
  filename text not null,
  mime text not null,
  size int not null,
  alt text not null default '',
  data bytea not null,
  created_at timestamptz not null default now()
);
alter table posts add column if not exists cover_media bigint;
create table if not exists rate_limits (
  key text not null,
  at timestamptz not null default now()
);
create index if not exists rate_limits_key_at on rate_limits (key, at desc);
create table if not exists categories (
  slug text primary key,
  code text not null default '',
  position int not null default 0,
  hidden boolean not null default false,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
`;

/** Returns a connected client (tables are created on first use), or null when DATABASE_URL is unset. */
export async function db(): Promise<Sql | null> {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!g.__sql) {
    g.__sql = postgres(url, { max: 3, idle_timeout: 20, connect_timeout: 10, prepare: false });
  }
  g.__ready ??= g.__sql.unsafe(SCHEMA).then(() => undefined);
  try {
    await g.__ready;
  } catch (e) {
    g.__ready = undefined;
    throw e;
  }
  return g.__sql;
}
