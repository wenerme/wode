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



create table if not exists alpine_pkg_meta
(
	id                text        not null default 'alppm_' || public.gen_ulid() primary key,
	uid               uuid        not null default gen_random_uuid() unique,
	created_at        timestamptz not null default current_timestamp,
	updated_at        timestamptz not null default current_timestamp,
	deleted_at        timestamptz,
	tid               text,
	eid               text,

	path              text        not null generated always as ( branch || '/' || channel || '/' || arch || '/' || pkg || '-' || version || '.apk') stored,
-- 	repo_path         text        not null generated always as ( branch || '/' || repo || '/' || arch ) stored,
	filename          text        not null generated always as ( pkg || '-' || version || '.apk' ) stored,

	branch            text        not null,
	arch              text        not null,
	channel           text        not null,

	pkg               text        not null,
	version           text        not null,
	checksum          text        not null,
	description       text,
	size              bigint      not null,
	install_size      bigint      not null,
	maintainer        text,
	origin            text,
	build_time        bigint      not null,
	commit            text,
	license           text,
	provider_priority int,
	url               text,
	depends           text[]      not null default '{}',
	provides          text[]      not null default '{}',
	install_if        text[]      not null default '{}',

	maintainer_name   text,
	maintainer_email  text,

	attributes        jsonb       not null default '{}',
	properties        jsonb       not null default '{}',
	extensions        jsonb       not null default '{}',
	unique (path)
);
