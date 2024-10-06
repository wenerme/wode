create table if not exists audit_log
(
  id           text        not null default 'audlog_' || public.gen_ulid() primary key,
  uid          uuid        not null default gen_random_uuid() unique,
  created_at   timestamptz not null default current_timestamp,
  updated_at   timestamptz not null default current_timestamp,
  deleted_at   timestamptz,
  tid          text        not null default public.current_tenant_id() references public.tenant (tid),
  eid          text,

  user_id      text,
  session_id   text,
  client_id    text,
  instance_id  text,
  title        text,
  description  text,
  comment      text,

  entity_id    text,
  entity_type  text,

  audit_time   timestamptz not null default current_timestamp,
  client_agent text,
  client_ip    inet,
  request_id   text,
  action_type  text, -- Create, Delete, Update, Login
  before       jsonb,
  after        jsonb,
  metadata     jsonb       not null default '{}',

  attributes   jsonb       not null default '{}',
  properties   jsonb       not null default '{}',
  extensions   jsonb       not null default '{}',
  unique (tid, eid)
);

create index if not exists audit_log_tid_created_at_idx on audit_log (tid, created_at);
create index if not exists audit_log_tid_updated_at_idx on audit_log (tid, updated_at);
create index if not exists audit_log_tid_user_id_idx on audit_log (tid, user_id);
create index if not exists audit_log_tid_entity_id_idx on audit_log (tid, entity_id);
create index if not exists audit_log_tid_audit_time_idx on audit_log (tid, audit_time);
