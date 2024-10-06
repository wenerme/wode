create table if not exists entity_schema
(
    id               text        not null default 'entsc_' || public.gen_ulid() primary key,
    uid              uuid        not null default gen_random_uuid() unique,
    created_at       timestamptz not null default current_timestamp,
    updated_at       timestamptz not null default current_timestamp,
    deleted_at       timestamptz,
    tid              text        not null default public.current_tenant_id() references tenant (tid),
    eid              text,

    display_name     text        not null, -- 文字
    description      text,
    type_name        text        not null, -- PascalCase
    resource_name    text,                 -- dash-case
    view_schema_name text,
    view_name        text,                 -- view -> table, view
    type_tag         text,
    metadata         jsonb       not null default '{}',

    view_schema      jsonb,
    type_schema      jsonb,

    sequence         bigint      not null default 0,

    attributes       jsonb       not null default '{}',
    properties       jsonb       not null default '{}',
    extensions       jsonb       not null default '{}',
    unique (tid, eid),
    unique nulls distinct (tid, view_schema_name, view_name),
    unique nulls distinct (tid, type_name)
);

create unique index if not exists entity_schema_tid_type_name_key on entity_schema (tid, type_name);

create or replace function next_entity_sid(in_type_name text, in_tid tenant.tid%TYPE = current_tenant_id())
    returns bigint
    language plpgsql
    volatile
as
$$
declare
    out_next entity_schema.sequence%TYPE;
begin
    if in_type_name is null then
        raise exception 'Empty sequence'
            using hint = 'check you table definition';
    end if;
    -- trigger less default computing
    update entity_schema
    set sequence=sequence + 1
    where tid = in_tid
      and type_name = in_type_name
      and updated_at = now()
    returning sequence into out_next;
    if out_next is null
    then
        insert into entity_schema(tid, type_name, sequence, uid, created_at, updated_at)
        values (in_tid, in_type_name, 1, gen_random_uuid(), now(), now())
        on conflict(tid,type_name) do update set (sequence, updated_at)= (excluded.sequence + 1, excluded.updated_at)
        returning sequence into out_next;
    end if;
    return out_next;
end;
$$;

create or replace function insert_entity_sid() returns trigger as
$$
begin
    if NEW.sid is null then
        NEW.sid := next_entity_sid(tg_argv[0], NEW.tid);
    end if;
    return new;
end;
$$ language plpgsql;


insert into entity_schema(display_name, type_name, view_name, type_tag)
values ('实体定义', 'EntitySchema', 'entity_schema', 'entsc')
on conflict do nothing;

insert into entity_schema(display_name, type_name, view_schema_name, view_name, type_tag)
values ('组织', 'Tenant', 'tenant', 'public', 'org')
on conflict do nothing;
