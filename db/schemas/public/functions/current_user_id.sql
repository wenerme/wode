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
