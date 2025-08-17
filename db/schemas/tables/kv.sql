create table if not exists kv
(
	id         text        not null default 'kv_' || public.gen_ulid() primary key,
	uid        uuid        not null default gen_random_uuid() unique,
	created_at timestamptz not null default current_timestamp,
	updated_at timestamptz not null default current_timestamp,
	deleted_at timestamptz,
	tid        text        not null default public.current_tenant_id() references public.tenant (tid),
	eid        text,

	namespace  text        not null default 'default',
	key        text        not null,
	type       text        not null default 'json',
	json       jsonb,
	blob       bytea,
	expires_at timestamptz,

	metadata   jsonb       not null default '{}',

	attributes jsonb       not null default '{}',
	properties jsonb       not null default '{}',
	extensions jsonb       not null default '{}',
	unique (tid, eid),
	unique (tid, namespace, key)
);


