set search_path to alpine,public;


create table if not exists apk_index
(
  id                 text        not null default 'apki_' || public.gen_ulid() primary key,
  uid                uuid        not null default gen_random_uuid() unique,
  created_at         timestamptz not null default current_timestamp,
  updated_at         timestamptz not null default current_timestamp,
  deleted_at         timestamptz,
  tid                text,
  eid                text,

  path               text        not null,
  branch             text        not null,
  arch               text        not null,
  repo               text        not null,
  description        text,
  size               int         not null default 0,
  content            text        not null default '',
  last_modified_time timestamptz not null,

  attributes         jsonb       not null default '{}',
  properties         jsonb       not null default '{}',
  extensions         jsonb       not null default '{}',
  unique (tid, eid),
  unique (path)
);


create table if not exists apk_index_pkg
(
  id                text        not null default 'apkip_' || public.gen_ulid() primary key,
  uid               uuid        not null default gen_random_uuid() unique,
  created_at        timestamptz not null default current_timestamp,
  updated_at        timestamptz not null default current_timestamp,
  deleted_at        timestamptz,
  tid               text,
  eid               text,

  path              text        not null,
  branch            text        not null,
  arch              text        not null,
  repo              text        not null,
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
  provider_priority bigint      not null,
  url               text,
  depends           text[]      not null default '{}',
  provides          text[]      not null default '{}',
  install_if        text[]      not null default '{}',

  attributes        jsonb       not null default '{}',
  properties        jsonb       not null default '{}',
  extensions        jsonb       not null default '{}',
  unique (tid, eid),
  unique (path)
);
