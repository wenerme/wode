create table if not exists file_content
(
	id         text        not null default 'filec' || public.gen_ulid() primary key,
	uid        uuid        not null default gen_random_uuid() unique,
	created_at timestamptz not null default current_timestamp,
	updated_at timestamptz not null default current_timestamp,
	deleted_at timestamptz,
	tid        text        not null default public.current_tenant_id() references public.tenant (tid),
	eid        text,
	cid        text,
	rid        text,

	filename   text,
	tags       text[],
	ext        text,
	mime_type  text,
	md5        text        not null,
	sha256     text        not null,
	size       bigint      not null,
	text       text,
	width      integer,
	height     integer,
	length     integer, -- 音频, 视频
	origin_url text,
	object_url text,
	ref_url    text,
	content    bytea,
	metadata   jsonb       not null default '{}',

	attributes jsonb       not null default '{}',
	properties jsonb       not null default '{}',
	extensions jsonb       not null default '{}',
	unique (tid, eid),
	unique (tid, md5),
	unique (tid, sha256)
);

create index if not exists file_content_tid_created_at_idx on file_content (tid, created_at);
create index if not exists file_content_tid_updated_at_idx on file_content (tid, updated_at);

