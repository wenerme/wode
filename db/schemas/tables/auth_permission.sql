create table if not exists auth_permission
(
	id             text        not null default 'authp_' || public.gen_ulid() primary key,
	uid            uuid        not null default gen_random_uuid() unique,
	created_at     timestamptz not null default current_timestamp,
	updated_at     timestamptz not null default current_timestamp,
	deleted_at     timestamptz,
	tid            text        not null default public.current_tenant_id() references public.tenant (tid),
	eid            text,

	title          text        not null,
	code           text        not null,
	description    text,
	system_managed boolean     not null default false,
	metadata       jsonb       not null default '{}',

	attributes     jsonb       not null default '{}',
	properties     jsonb       not null default '{}',
	extensions     jsonb       not null default '{}',
	unique (tid, eid),
	unique (tid, code)
);

comment on table auth_permission is '权限';
