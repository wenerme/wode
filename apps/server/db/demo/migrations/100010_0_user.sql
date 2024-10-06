create table if not exists users
(
  id                       text        not null default 'user_' || public.gen_ulid() primary key,
  uid                      uuid        not null default gen_random_uuid() unique,
  created_at               timestamptz not null default current_timestamp,
  updated_at               timestamptz not null default current_timestamp,
  deleted_at               timestamptz,
  tid                      text        not null default public.current_tenant_id() references public.tenant (tid),
  eid                      text,

  full_name                text        not null,
  display_name             text,
  login_name               text,
  email                    text,
  phone_number             text,
  phone_number_verified_at timestamptz,
  password                 text,
  birth_date               date,
  avatar_url               text,
  photo_url                text,
  sex                      text,
  admin                    boolean     not null default false,

  notes                    text,

  attributes               jsonb       not null default '{}',
  properties               jsonb       not null default '{}',
  extensions               jsonb       not null default '{}',
  unique (tid, eid),
  unique (tid, login_name),
  unique (tid, email),
  foreign key (sex) references sex_type (value)
);

create index if not exists users_tid_created_at_idx on users (tid, created_at);
create index if not exists users_tid_updated_at_idx on users (tid, updated_at);
