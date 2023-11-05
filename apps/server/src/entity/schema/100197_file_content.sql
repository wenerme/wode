create table if not exists file_content
(
    id         text        not null default 'filec_' || public.gen_ulid() primary key,
    uid        uuid        not null default gen_random_uuid() unique,
    created_at timestamptz not null default current_timestamp,
    updated_at timestamptz not null default current_timestamp,
    deleted_at timestamptz,
    tid        text        not null default public.current_tenant_id() references public.tenant (tid),
    eid        text,

    file_name  text,
    ext        text,
    mime_type  text        not null default 'application/octet-stream',
    md5sum     text        not null,
    sha256sum  text        not null,
    size       bigint      not null,
    text       text,
    width      integer,
    height     integer,
    length     integer, -- 音频, 视频
    origin_url text,
    object_url text,
    content    bytea       not null,
    metadata   jsonb       not null default '{}',

    attributes jsonb       not null default '{}',
    properties jsonb       not null default '{}',
    extensions jsonb       not null default '{}',
    unique (tid, eid),
    unique (tid, md5sum),
    unique (tid, sha256sum)
);

insert into entity_schema(display_name, type_name, view_name, type_tag)
values ('文件内容', 'FileContent', 'file_content', 'filec')
on conflict do nothing;

create index if not exists file_content_tid_created_at_idx on file_content (tid, created_at);
create index if not exists file_content_tid_updated_at_idx on file_content (tid, updated_at);
