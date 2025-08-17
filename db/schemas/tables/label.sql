create table if not exists label
(
	id            text        not null default 'lab_' || public.gen_ulid() primary key,
	uid           uuid        not null default gen_random_uuid() unique,
	created_at    timestamptz not null default current_timestamp,
	updated_at    timestamptz not null default current_timestamp,
	deleted_at    timestamptz,
	tid           text        not null default public.current_tenant_id() references public.tenant (tid),
	eid           text,

	title         text        not null,
	code          text,
	description   text,
	display_order bigint      not null default nextval('seq_display_order'),
	style         jsonb,
	entity_types  text[]      not null default '{}',
	state         text        not null default 'Active',
	status        text        not null default 'Active',

	created_by_id text                 default public.current_user_id() references users (id),
	updated_by_id text                 default public.current_user_id() references users (id),
	deleted_by_id text,

	attributes    jsonb       not null default '{}',
	properties    jsonb       not null default '{}',
	extensions    jsonb       not null default '{}',
	unique (tid, eid),
	unique (tid, code),
	unique (tid, title)
);
