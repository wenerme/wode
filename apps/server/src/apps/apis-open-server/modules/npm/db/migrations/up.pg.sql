create schema if not exists npm;
set search_path to npm, public;

create table package_meta
(
  id         text  not null default public.gen_random_uuid() primary key,
  created_at timestamptz    default current_timestamp,
  updated_at timestamptz    default current_timestamp,

  name       text  not null unique,
  meta       jsonb not null
);

