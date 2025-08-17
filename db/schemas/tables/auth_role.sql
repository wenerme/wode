create table if not exists auth_role
(
	id             text        not null default 'authr_' || public.gen_ulid() primary key,
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

	state          text        not null default 'Active',
	status         text        not null default 'Active',

	attributes     jsonb       not null default '{}',
	properties     jsonb       not null default '{}',
	extensions     jsonb       not null default '{}',
	unique (tid, eid),
	unique (tid, code)
);

comment on table auth_role is '角色';
comment on column auth_role.title is '角色标题';
comment on column auth_role.code is '角色代码';
comment on column auth_role.description is '角色描述';
