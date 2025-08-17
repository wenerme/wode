create table tpl
(
	id            text        not null default 'tpl_' || public.gen_ulid() primary key,
	uid           uuid        not null default gen_random_uuid() unique,
	created_at    timestamptz not null default current_timestamp,
	updated_at    timestamptz not null default current_timestamp,
	deleted_at    timestamptz,
	tid           text        not null default public.current_tenant_id() references public.tenant (tid),
	eid           text,

	full_name     text        not null,
	display_name  text,
	description   text,


	created_by_id text                 default public.current_user_id() references users (id),
	updated_by_id text                 default public.current_user_id() references users (id),
	deleted_by_id text references users (id),

	attributes    jsonb       not null default '{}'::jsonb,
	properties    jsonb       not null default '{}'::jsonb,
	extensions    jsonb       not null default '{}'::jsonb,
	unique (tid, eid)
);
