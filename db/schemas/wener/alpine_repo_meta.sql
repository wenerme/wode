create table if not exists alpine_repo_meta
(
	id                 text        not null default 'alprm_' || public.gen_ulid() primary key,
	uid                uuid        not null default gen_random_uuid() unique,
	created_at         timestamptz not null default current_timestamp,
	updated_at         timestamptz not null default current_timestamp,
	deleted_at         timestamptz,
	tid                text,
	eid                text,

	path               text        not null generated always as ( branch || '/' || channel || '/' || arch ) stored,
	branch             text        not null,
	arch               text        not null,
	channel            text        not null,

	description        text,
	size               int         not null default 0,
	content            text        not null default '',
	last_modified_time timestamptz not null,
	version            text,

	attributes         jsonb       not null default '{}',
	properties         jsonb       not null default '{}',
	extensions         jsonb       not null default '{}',
	unique (path)
);



