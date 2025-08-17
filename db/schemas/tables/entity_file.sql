create table if not exists entity_file
(
	id            text        not null default 'entfile_' || public.gen_ulid() primary key,
	uid           uuid        not null default gen_random_uuid() unique,
	created_at    timestamptz not null default current_timestamp,
	updated_at    timestamptz not null default current_timestamp,
	deleted_at    timestamptz,
	tid           text        not null default public.current_tenant_id(),
	eid           text,

	entity_id     text        not null,
	entity_type   text        not null,
	related_id    text        not null references file (id),
	display_order float8      not null default nextval('seq_display_order'),

	created_by_id text                 default public.current_user_id() references users (id),
	updated_by_id text                 default public.current_user_id() references users (id),
	deleted_by_id text,

	attributes    jsonb       not null default '{}',
	properties    jsonb       not null default '{}',
	extensions    jsonb       not null default '{}',

	unique (tid, eid),
	unique (tid, entity_id, related_id)
);

create index if not exists entity_file_tid_created_at_idx on entity_file (tid, created_at);
create index if not exists entity_file_tid_updated_at_idx on entity_file (tid, updated_at);
