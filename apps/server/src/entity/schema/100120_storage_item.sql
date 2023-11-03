create table if not exists storage_item
(
    id            text        not null default 'stori_' || public.gen_ulid() primary key,
    uid           uuid        not null default gen_random_uuid() unique,
    created_at    timestamptz not null default current_timestamp,
    updated_at    timestamptz not null default current_timestamp,
    deleted_at    timestamptz,
    tid           text,
    eid           text,

    code          text,
    auth_token    text,

    link          text,    -- redirect
    file_name     text,
    ext           text,
    mime_type     text,
    md5sum        text,
    sha256sum     text,
    size          bigint,
    text          text,
    width         integer,
    height        integer,
    length        integer, -- 音频, 视频
    origin_url    text,
    object_url    text,
    content       bytea,
    metadata      jsonb       not null default '{}',

    owner_id      text,
    owner_type    text,

    created_by_id text,
    updated_by_id text,
    deleted_by_id text,

    attributes    jsonb       not null default '{}',
    properties    jsonb       not null default '{}',
    extensions    jsonb       not null default '{}',
    unique (tid, eid),
    unique (code)
);
