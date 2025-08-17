-- atlas:import ../public/functions/current_tenant_id.sql

-- 系统或组建设置
create table if not exists setting
(
	id          text        not null default 'set_' || public.gen_ulid() primary key,
	uid         uuid        not null default gen_random_uuid() unique,
	created_at  timestamptz not null default current_timestamp,
	updated_at  timestamptz not null default current_timestamp,
	deleted_at  timestamptz,
	tid         text        not null default public.current_tenant_id() references public.tenant (tid),
	eid         text,

	title       text        not null,
	description text,
	key         text        not null,
	type        text        not null,
	value       jsonb,
	schema      jsonb,

	metadata    jsonb       not null default '{}',

	attributes  jsonb       not null default '{}',
	properties  jsonb       not null default '{}',
	extensions  jsonb       not null default '{}',
	unique (tid, eid),
	unique (tid, key)
);


