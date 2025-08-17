create table if not exists file
(
	id            text        not null default 'file_' || public.gen_ulid() primary key,
	uid           uuid        not null default gen_random_uuid() unique,
	created_at    timestamptz not null default current_timestamp,
	updated_at    timestamptz not null default current_timestamp,
	deleted_at    timestamptz,
	tid           text        not null default public.current_tenant_id() references public.tenant (tid),
	eid           text,
	cid           text,
	rid           text,

	filename      text,
	tags          text[],
	ext           text,
	mime_type     text,
	md5           text        not null,
	sha256        text        not null,
	size          bigint      not null,
	text          text,
	width         integer,
	height        integer,
	length        integer,
	duration      float4,

	origin_url    text,
	object_url    text,
	ref_url       text,
	content       bytea,
	metadata      jsonb       not null default '{}',

	title         text,
	description   text,
	caption       text,
	alt           text,

	entity_id     text,
	entity_type   text,

	version       bigint      not null default 0,

	owner_id      text,
	owner_type    text,
	owner_user_id text generated always as ( case owner_type when 'User' then owner_id end ) stored,
	owner_team_id text generated always as ( case owner_type when 'Team' then owner_id end ) stored,

	created_by_id text                 default public.current_user_id() references users (id),
	updated_by_id text                 default public.current_user_id() references users (id),
	deleted_by_id text references users (id),

	attributes    jsonb       not null default '{}',
	properties    jsonb       not null default '{}',
	extensions    jsonb       not null default '{}',
	unique (tid, eid),
	foreign key (owner_user_id) references users (id)
);

create index if not exists file_tid_created_at_idx on file (tid, created_at);
create index if not exists file_tid_updated_at_idx on file (tid, updated_at);
create index if not exists file_tid_owner_id_idx on file (tid, owner_id);
create index if not exists file_tid_entity_id_idx on file (tid, entity_id);
create index if not exists file_tid_md5sum_idx on file (tid, md5);
create index if not exists file_tid_sha256sum_idx on file (tid, sha256);


