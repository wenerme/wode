create table if not exists event
(
	id           text        not null default 'evt_' || public.gen_ulid() primary key,
	uid          uuid        not null default gen_random_uuid() unique,
	created_at   timestamptz not null default current_timestamp,
	updated_at   timestamptz not null default current_timestamp,
	deleted_at   timestamptz,
	tid          text        not null default public.current_tenant_id() references public.tenant (tid),
	eid          text,

	event_id     text,
	event_key    text, -- 业务产生 - 去重、识别
	event_time   timestamptz not null default current_timestamp,
	type         text        not null,
	payload      jsonb,
	metadata     jsonb       not null default '{}',

	entity_id    text,
	entity_type  text,

	client_agent text,
	client_id    text,
	client_ip    inet,
	instance_id  text,
	request_id   text,
	session_id   text,
	user_id      text,

	tags         text[],

	attributes   jsonb       not null default '{}',
	properties   jsonb       not null default '{}',
	extensions   jsonb       not null default '{}',
	unique (tid, eid),
	unique (tid, event_id),
	unique (tid, event_key)
);

create index if not exists event_tid_created_at_idx on event (tid, created_at);
create index if not exists event_tid_updated_at_idx on event (tid, updated_at);
create index if not exists event_tid_event_time_idx on event (tid, event_time);
create index if not exists event_tid_event_id_idx on event (tid, event_id);
create index if not exists event_tid_entity_id_idx on event (tid, entity_id);
create index if not exists event_tid_user_id_idx on event (tid, user_id);
