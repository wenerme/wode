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
