-- Applied with `pnpm --filter @vectilume/web db:migrate`; every statement is safe to run again.

create table if not exists api_keys (
  id serial primary key,
  email text not null,
  -- SHA-256 of the token; the token itself is shown once and never stored.
  token_hash text not null unique,
  -- SHA-256 of the client IP, only for the keys-per-hour limit.
  ip_hash text not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists api_keys_ip_created on api_keys (ip_hash, created_at);

create table if not exists icon_requests (
  id serial primary key,
  key_id integer not null references api_keys (id),
  name text not null,
  description text not null,
  keywords text[] not null default '{}',
  -- "done" is not stored: it comes from the published npm manifest (entry.request = id).
  status text not null default 'open' check (status in ('open', 'in-progress', 'declined')),
  decline_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists icon_requests_key_created on icon_requests (key_id, created_at);
