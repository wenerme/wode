-- 系统或组建设置
create table if not exists logging
(
	id           text        not null default 'log_' || public.gen_ulid() primary key,
	uid          uuid        not null default gen_random_uuid() unique,
	created_at   timestamptz not null default current_timestamp,
	updated_at   timestamptz not null default current_timestamp,
	deleted_at   timestamptz,
	tid          text        not null default public.current_tenant_id() references public.tenant (tid),
	eid          text,

	user_id      text,
	session_id   text,
	request_id   text,
	client_id    text,
	client_agent text,
	client_ip    inet,

	timestamp    timestamptz not null default current_timestamp,
	tag          text,
	level        text,
	type         text,
	message      text,
	context      jsonb,
	tags         text[],

	metadata     jsonb       not null default '{}',

	attributes   jsonb       not null default '{}',
	properties   jsonb       not null default '{}',
	extensions   jsonb       not null default '{}',
	unique (tid, eid)
);
