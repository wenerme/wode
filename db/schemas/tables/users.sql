create table if not exists users
(
	id                       text        not null default 'user_' || public.gen_ulid() primary key,
	uid                      uuid        not null default gen_random_uuid() unique,
	created_at               timestamptz not null default current_timestamp,
	updated_at               timestamptz not null default current_timestamp,
	deleted_at               timestamptz,
	tid                      text        not null default public.current_tenant_id(),
	eid                      text,

	full_name                text        not null,
	display_name             text,
	login_name               text,
	email                    text,
	email_verified_at        timestamptz,
	phone_number             text,
	phone_number_verified_at timestamptz,
	password                 text,
	admin                    boolean     not null default false,

	avatar_url               text,
	photo_url                text,
	job_number               text,
	job_title                text,
	join_date                date,
	birth_date               date,

	state                    text        not null default 'Active',
	status                   text        not null default 'Active',
	status_reason            text,
	status_updated_at        timestamptz,
	status_updated_by_id     text,

	version                  timestamptz not null default current_timestamp(3),

	notes                    text,

	attributes               jsonb       not null default '{}',
	properties               jsonb       not null default '{}',
	extensions               jsonb       not null default '{}',
	unique (tid, eid),
	unique (tid, login_name),
	unique (tid, email),
);

create index if not exists users_tid_created_at_idx on users (tid, created_at);
create index if not exists users_tid_updated_at_idx on users (tid, updated_at);

create unique index if not exists users_tid_login_name_key on users (tid, login_name);

comment on table users is '用户';
