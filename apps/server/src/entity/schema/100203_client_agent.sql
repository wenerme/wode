create table if not exists client_agent
(
  id           text        not null default 'ca_' || public.gen_ulid() primary key,
  uid          uuid        not null default gen_random_uuid() unique,
  created_at   timestamptz not null default current_timestamp,
  updated_at   timestamptz not null default current_timestamp,
  deleted_at   timestamptz,
  tid          text        not null default public.current_tenant_id() references public.tenant (tid),
  eid          text,

  display_name text        not null,
  description  text,
  type         text        not null,
  secrets      jsonb       not null default '{}',
  config       jsonb       not null default '{}',
  active       boolean     not null default true,
  metadata     jsonb       not null default '{}',

  attributes   jsonb       not null default '{}',
  properties   jsonb       not null default '{}',
  extensions   jsonb       not null default '{}',
  unique (tid, eid)
);
