create table if not exists entity_label
(
	id            text        not null default 'entlab_' || public.gen_ulid() primary key,
	uid           uuid        not null default gen_random_uuid() unique,
	created_at    timestamptz not null default current_timestamp,
	updated_at    timestamptz not null default current_timestamp,
	deleted_at    timestamptz,
	tid           text        not null default public.current_tenant_id() references public.tenant (tid),
	eid           text,

	label_id      text        not null references label (id),
	entity_id     text        not null,
	entity_type   text,

	created_by_id text                 default public.current_user_id() references users (id),
	updated_by_id text                 default public.current_user_id() references users (id),
	deleted_by_id text references users (id),

	attributes    jsonb       not null default '{}',
	properties    jsonb       not null default '{}',
	extensions    jsonb       not null default '{}',
	unique (tid, eid),
	unique (tid, label_id, entity_id)
);

-- alter table entity_label
--     add column if not exists account_id     text generated always as ( case when entity_type = 'Account' then entity_id end ) stored,
--     add foreign key (account_id) references account (id) on delete cascade,
--     add column if not exists contact_id     text generated always as ( case when entity_type = 'Contact' then entity_id end ) stored,
--     add foreign key (contact_id) references contact (id) on delete cascade,
--     add column if not exists lead_id        text generated always as ( case when entity_type = 'Lead' then entity_id end ) stored,
--     add foreign key (lead_id) references lead (id) on delete cascade,
--     add column if not exists opportunity_id text generated always as ( case when entity_type = 'Opportunity' then entity_id end ) stored,
--     add foreign key (opportunity_id) references opportunity (id) on delete cascade,
--     add column if not exists order_id       text generated always as ( case when entity_type = 'Order' then entity_id end ) stored,
--     add foreign key (order_id) references orders (id) on delete cascade
-- ;
