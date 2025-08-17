create or replace function insert_entity_sid() returns trigger as
$$
begin
	if NEW.sid is null then
		NEW.sid := next_entity_sid(tg_argv[0], NEW.tid);
	end if;
	return new;
end;
$$ language plpgsql;
