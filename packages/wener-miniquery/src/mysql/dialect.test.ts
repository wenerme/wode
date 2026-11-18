import { expect, test } from 'vitest';
import { formatMysql, parseMysql, parseMysqlExpr } from './index';

test.each([
	'SELECT a FROM t INTO OUTFILE \'x\' FORMAT AS CSV PROPERTIES ("k"="v")',
	'EXPLAIN VERBOSE SELECT 1',
	'CREATE TABLE t (id INT) DISTRIBUTED BY HASH(id) BUCKETS 3 PROPERTIES ("replication_num"="1")',
	'ALTER TABLE t DISTRIBUTED BY HASH(id) BUCKETS 3',
	'ALTER TABLE t PROPERTIES ("replication_num"="1")',
])('Doris extensions require an explicit dialect: %s', (sql) => {
	expect(() => parseMysql(sql)).toThrow();
	const ast = parseMysql(sql, { dialect: 'doris' });
	expect(parseMysql(formatMysql(ast), { dialect: 'doris' })).toEqual(ast);
});

test.each([
	'EXPLAIN FORMAT=JSON SELECT 1',
	'EXPLAIN FORMAT=TREE SELECT 1',
	'EXPLAIN FORMAT=TRADITIONAL SELECT 1',
	"SELECT a FROM t INTO OUTFILE 'x' CHARACTER SET utf8mb4 FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '\"' LINES TERMINATED BY '\\n'",
	"CREATE TABLE t (id INT) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='DISTRIBUTED  PROPERTIES'",
	'CREATE TABLE t (id INT) ENGINE=InnoDB PARTITION BY HASH(id) PARTITIONS 4',
	'CREATE TABLE t (id INT) PARTITION BY RANGE(id) (PARTITION p0 VALUES LESS THAN (10))',
	'CREATE TABLE t (id INT) TABLESPACE ts1 AUTOEXTEND_SIZE=4194304',
	'CREATE TABLE t (id INT) AUTOEXTEND_SIZE=4M',
	'CREATE TABLE t (id INT) ENGINE=MRG_MyISAM UNION=(a,b)',
	'CREATE TABLE t (id INT) SECONDARY_ENGINE=RAPID',
	'CREATE TABLE t (id INT) START TRANSACTION',
])('native syntax retains its meaning: %s', (sql) => {
	const ast = parseMysql(sql);
	expect(parseMysql(formatMysql(ast))).toEqual(ast);
});

test('captures and expands mysqldump partition version comments', () => {
	const sql =
		'CREATE TABLE t (id INT) ENGINE=InnoDB /*!50100 PARTITION BY RANGE(id) (PARTITION p0 VALUES LESS THAN (10)) */';
	const ast = parseMysql(sql);
	expect(ast[0]).toMatchObject({ type: 'Create', options: expect.stringContaining('PARTITION BY RANGE') });
	expect(parseMysql(formatMysql(ast))).toEqual(ast);
});

test.each([
	'EXPLAIN FORMAT=BOGUS SELECT 1',
	"SELECT 1 INTO DUMPFILE 'x' FIELDS TERMINATED BY ','",
	"SELECT 1 INTO OUTFILE 'x' GARBAGE",
	'CREATE TABLE t (id INT) GARBAGE',
])('rejects unsupported native options: %s', (sql) => {
	expect(() => parseMysql(sql)).toThrow();
});

test.each(['a == 1', 'a @> [1]', "a ILIKE 'x'", 'a IN [1, 2]', '[1, 2]', 'a IN ()'])(
	'does not add MiniQuery operators or lists to MySQL: %s',
	(expr) => {
		expect(() => parseMysqlExpr(expr)).toThrow();
	},
);
