create table if not exists access_token
(
  id                 text        not null default 'at_' || public.gen_ulid() primary key,
  uid                uuid        not null default gen_random_uuid() unique,
  created_at         timestamptz not null default current_timestamp,
  updated_at         timestamptz not null default current_timestamp,
  deleted_at         timestamptz,
  tid                text        not null default public.current_tenant_id() references public.tenant (tid),
  eid                text,

  subject_id         text        not null,
  subject_type       text        not null,
  display_name       text,
  session_id         text        not null default gen_random_uuid(),
  client_id          text,
  grant_type         text        not null, -- e.g. password, manual, refresh_token, client_credentials, authorization_code, implicit, device_code
  token_type         text        not null, -- e.g. bearer, secret_key
  scopes             text[]      not null default '{}'::text[],
  access_token       text        not null,
  expires_at         timestamptz,
  expires_in         int,
  revoked_at         timestamptz,
  refresh_token      text,
  refresh_expires_in int,
  refresh_expires_at timestamptz,
  refresh_count      int         not null default 0,
  last_used_at       timestamptz,
  metadata           jsonb       not null default '{}',

  attributes         jsonb       not null default '{}',
  properties         jsonb       not null default '{}',
  extensions         jsonb       not null default '{}',
  unique (tid, eid)
);
