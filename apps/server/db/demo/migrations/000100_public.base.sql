select *
from pg_available_extensions
order by name;

-- function
create extension if not exists pgcrypto;
-- create extension if not exists pg_jsonschema;
-- create extension if not exists pg_hashids;

-- performance & index
-- create extension if not exists pgroonga;
-- create extension if not exists rum;

-- ops
create extension if not exists pg_stat_statements;
-- create extension if not exists pg_stat_monitor;

-- pl
create extension if not exists plv8;

-- rich data source & storage
-- create extension if not exists postgres_fdw;
-- create extension if not exists timescaledb;
-- create extension if not exists wrappers;

