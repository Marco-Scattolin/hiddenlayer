-- HiddenLayer schema
-- Run this in the Supabase SQL editor to create all required tables.

create table if not exists users (
  username     text primary key,
  email        text,
  password_hash text not null
);

create table if not exists contacts (
  id        bigint generated always as identity primary key,
  username  text not null,
  name      text not null,
  category  text,
  address   text,
  phone     text,
  maps_url  text not null,
  reason    text not null default '',
  saved_at  timestamptz not null default now(),
  unique (username, maps_url)
);

create table if not exists reports (
  id            uuid primary key default gen_random_uuid(),
  timestamp     timestamptz not null default now(),
  username      text not null,
  type          text not null,
  business_name text,
  subject       text,
  note          text not null default ''
);

-- Disable RLS (this app uses iron-session, not Supabase Auth)
alter table users    disable row level security;
alter table contacts disable row level security;
alter table reports  disable row level security;
