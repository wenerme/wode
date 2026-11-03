import { describe, expect, it } from 'vitest';
import { isReadOnlySQL } from './readonly';

describe('OpenObserve DataFusion read-only SQL', () => {
	it.each([
		'SELECT 1', ' /* query */ SELECT * FROM "delete";',
		"SELECT 'delete; update', 'it''s safe', match_all('error') FROM app -- write words are comments",
		'WITH x AS (SELECT * FROM app), y AS (SELECT count(*) FROM x) SELECT * FROM y',
		'WITH "delete" AS (SELECT 1) SELECT * FROM "delete"',
		'EXPLAIN SELECT * FROM app', 'EXPLAIN VERBOSE WITH x AS (SELECT 1) SELECT * FROM x',
		"SELECT histogram(_timestamp, '1 minute'), approx_distinct(user_id), re_match(message, 'a') FROM app GROUP BY 1",
		'SELECT custom_datafusion_function("field") FROM app',
	])('accepts a single read query: %s', (sql) => expect(isReadOnlySQL(sql)).toBe(true));
	it.each([
		'', ';', 'SELECT 1;;', 'SELECT 1; SELECT 2', 'SELECT 1; DROP TABLE app',
		'DELETE FROM app', 'SHOW TABLES', 'WITH x AS (DELETE FROM app RETURNING *) SELECT * FROM x',
		'EXPLAIN ANALYZE SELECT * FROM app', 'EXPLAIN INSERT INTO app SELECT 1', 'SELECT * INTO other FROM app',
		'SELECT (DELETE FROM app)', 'SELECT nextval(\'s\')', 'SELECT "set_config"(\'a\', \'b\', false)',
		'SELECT pg_catalog."pg_advisory_lock"(1)', 'SELECT writefile(\'x\', \'y\')',
		"SELECT 1--x'\n, pg_advisory_lock(1)", 'SELECT 1 /* unfinished', "SELECT 'unfinished", 'SELECT (1',
		'SELECT 1 /*! DELETE FROM app */', 'SELECT 1 /* outer /* nested */ */',
		"SELECT 'abc\\'; SELECT pg_sleep(10); --'", 'EXPLAIN nonsense SELECT 1',
	])('rejects mutation, side effects or ambiguous SQL: %s', (sql) => expect(isReadOnlySQL(sql)).toBe(false));
});
