-- atlas:import ../functions/gen_ulid.sql

create table if not exists public.tenant
(
	id           text        not null default ('org_' || public.gen_ulid()) primary key,
	uid          uuid        not null default gen_random_uuid() unique,
	created_at   timestamptz not null default current_timestamp,
	updated_at   timestamptz not null default current_timestamp,
	deleted_at   timestamptz,
	tid          text        not null generated always as ( id ) stored unique,
	display_name text        not null,
	full_name    text        not null,
	enabled      bool        not null default true
);
