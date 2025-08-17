create table if not exists auth_entity_permission
(
	id          text        not null default 'authep_' || public.gen_ulid() primary key,
	uid         uuid        not null default gen_random_uuid() unique,
	created_at  timestamptz not null default current_timestamp,
	updated_at  timestamptz not null default current_timestamp,
	deleted_at  timestamptz,
	tid         text        not null default public.current_tenant_id() references public.tenant (tid),
	eid         text,

	entity_id   text        not null,
	entity_type text        not null, -- AuthRole, User, Team, Group, Organization, etc.
	related_id  text        not null references auth_permission (id),

	attributes  jsonb       not null default '{}',
	properties  jsonb       not null default '{}',
	extensions  jsonb       not null default '{}',
	unique (tid, eid),
	unique (tid, entity_id, related_id)
);
