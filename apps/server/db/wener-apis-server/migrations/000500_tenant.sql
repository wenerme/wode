create table if not exists public.tenant
(
  id           text        not null default ('org_' || public.gen_ulid()) primary key,
  uid          uuid        not null default gen_random_uuid() unique,
  created_at   timestamptz not null default current_timestamp,
  updated_at   timestamptz not null default current_timestamp,
  deleted_at   timestamptz,
  tid          text        not null generated always as ( id ) stored unique,
  display_name text        not null,
  full_name    text        not null,
  enabled      bool        not null default true
);

create or replace function public.current_tenant_id()
  returns text
  stable
  parallel safe
  language plpgsql as
$$
declare
  val text := nullif(current_setting('tenant.id', true), '')::text;
begin
  --     IF val IS NULL THEN
  --         RAISE EXCEPTION 'Missing tenant in context'
  --             USING HINT = 'Please check your execution context';
  --     END IF;
  -- NOTE 目前还没完全实现
  RETURN coalesce(val, 'org_00000000000000000000000000');
end;
$$;

create or replace function public.current_user_id()
  returns text
  stable
  parallel safe
  language plpgsql as
$$
declare
  val text := nullif(current_setting('user.id', true), '')::text;
begin
  --     IF val IS NULL THEN
  --         RAISE EXCEPTION 'Missing user in context'
  --             USING HINT = 'Please check your execution context';
  --     END IF;
  -- NOTE 目前允许为 null
  RETURN val;
end;
$$;

insert into tenant(id, display_name, full_name)
values ('org_00000000000000000000000000', '默认', '系统默认')
on conflict do nothing;
