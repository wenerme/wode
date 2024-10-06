-- universal sequence
create sequence if not exists seq_display_order as bigint increment 100;

create table if not exists tpl_sys_dict
(
  value         text  not null primary key,
  label         text,
  display_order bigint         default nextval('seq_display_order'),
  attributes    jsonb not null default '{}'::jsonb,
  properties    jsonb not null default '{}'::jsonb,
  extensions    jsonb not null default '{}'::jsonb
);

create table if not exists sex_type
(
  like tpl_sys_dict including all
);

insert into sex_type (value, label)
values ('Male', '男'),
       ('Female', '女'),
       ('Unknown', '未知')
on conflict(value) do update set (label, extensions) = (excluded.label, excluded.extensions);
