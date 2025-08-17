create table if not exists entity_schema
(
	id               text        not null default 'entsc_' || public.gen_ulid() primary key,
	uid              uuid        not null default gen_random_uuid() unique,
	created_at       timestamptz not null default current_timestamp,
	updated_at       timestamptz not null default current_timestamp,
	deleted_at       timestamptz,
	tid              text        not null default public.current_tenant_id() references tenant (tid),
	eid              text,

	display_name     text        not null, -- 文字
	description      text,
	type_name        text        not null, -- PascalCase
	resource_name    text,                 -- dash-case
	view_schema_name text,
	view_name        text,                 -- view -> table, view
	type_tag         text,
	metadata         jsonb       not null default '{}',

	view_schema      jsonb,
	type_schema      jsonb,

	sequence         bigint      not null default 0,

	attributes       jsonb       not null default '{}',
	properties       jsonb       not null default '{}',
	extensions       jsonb       not null default '{}',
	unique (tid, eid),
	unique nulls distinct (tid, view_schema_name, view_name),
	unique nulls distinct (tid, type_name)
);

create unique index if not exists entity_schema_tid_type_name_key on entity_schema (tid, type_name);
