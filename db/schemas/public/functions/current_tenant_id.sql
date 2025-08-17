CREATE OR REPLACE FUNCTION public.current_tenant_id()
	RETURNS text
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
