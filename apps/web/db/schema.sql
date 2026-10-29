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

-- v0.3.0: "ready" = drawn and added to the library, waiting for the npm release.
-- v0.7.0: "accepted" = approved by the owner, queued for Codex; "review" = drawn by Codex, waiting for the owner's approval.
alter table icon_requests drop constraint if exists icon_requests_status_check;
alter table icon_requests add constraint icon_requests_status_check check (status in ('open', 'accepted', 'in-progress', 'review', 'ready', 'declined'));

-- v0.5.0: tokens issued after confirming the email by a mailed link see every request of that email.
alter table api_keys add column if not exists verified_at timestamptz;
create index if not exists api_keys_email on api_keys (email);

create table if not exists email_confirmations (
  id serial primary key,
  email text not null,
  -- SHA-256 of the one-time code in the mailed link; valid 15 minutes, used once.
  code_hash text not null unique,
  ip_hash text not null,
  created_at timestamptz not null default now(),
  used_at timestamptz
);

create index if not exists email_confirmations_email_created on email_confirmations (email, created_at);
create index if not exists email_confirmations_ip_created on email_confirmations (ip_hash, created_at);

-- v0.6.0: set once the "your icon is on npm" email went out (or was skipped), so it is sent once.
alter table icon_requests add column if not exists done_notified_at timestamptz;

-- v0.7.0: what Codex sent for review (icon id, {outline, duotone, solid} SVGs) and the owner's note when asking for changes.
alter table icon_requests add column if not exists review_icon text;
alter table icon_requests add column if not exists review_svgs jsonb;
alter table icon_requests add column if not exists review_note text;

-- v0.7.0: per address; notify = false stops request emails (not the confirmation link). The code keys the stop link in every email.
create table if not exists email_settings (
  email text primary key,
  notify boolean not null default true,
  unsubscribe_code text not null unique,
  updated_at timestamptz not null default now()
);
