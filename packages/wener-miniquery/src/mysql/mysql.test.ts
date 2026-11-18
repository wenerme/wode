import { describe, expect, test } from 'vitest';
import { analyzeMysql, formatMysql, type MysqlDialect, parseMysql, parseMysqlExpr, visitMysql } from './index';

const MysqlExamples = [
	'select 1',
	'SELECT a, b AS c, t.* FROM db.t1 AS t WHERE a > 1 AND b IN (1,2) OR c LIKE "x%" ORDER BY a DESC LIMIT 10, 20',
	'select distinct sql_no_cache a from t limit 10 offset 5',
	'select count(*), count(distinct a), group_concat(b order by b desc separator ",") from t group by a with rollup having count(*) > 1',
	'select * from a left join b on a.id = b.id join c using (id) natural join d cross join e where exists (select 1 from d where d.x = a.x)',
	'select * from a, (select 1 as x) as s, (b join c on b.id = c.id)',
	'select * from t use index (idx_a) ignore index for join (idx_b)',
	'with recursive x (n) as (select 1 union all select n + 1 from x where n < 10) select * from x',
	'select a from t1 union select a from t2 union all (select a from t3 order by a limit 1) order by a limit 1',
	'select a from t1 except select a from t2 intersect select a from t3',
	'(select a from t1) union distinct (select a from t2)',
	'insert into t (a,b) values (1,2),(3,default) on duplicate key update b = values(b)',
	'insert ignore into db.t set a = 1, b = now()',
	'insert into t (a) select a from s where s.x > 0',
	'replace low_priority into t values (1) as n',
	'update t set a = a + 1 where id = ? order by id limit 1',
	'update t1 join t2 on t1.id = t2.id set t1.a = t2.a, t1.b = null where t2.x is not null',
	'delete t1, t2 from t1 join t2 on t1.id=t2.id where t2.x is null',
	'delete from t1, t2 using t1 join t2 on t1.id = t2.id where t1.a = 1',
	'delete low_priority quick ignore from t where id = 1 order by id limit 10',
	'select case when a then 1 else 2 end, case a when 1 then 2 end, cast(a as decimal(10, 2)), convert(a, char(10)), convert(a using utf8mb4)',
	'select interval 1 day + now(), date_add(now(), interval -1 hour), extract(year from d), trim(leading "x" from s), trim(s), position("a" in s), substring(s from 2 for 3)',
	'select current_timestamp, current_timestamp(3), utc_date()',
	'select a->>"$.b", a->"$.c", @a := 1, @@session.sql_mode, @@max_connections, @`x y`',
	'select row_number() over (partition by a order by b rows between unbounded preceding and current row), sum(x) over w from t window w as (order by y)',
	'select * from t where a = 1 # comment\n -- c\n and b = 2 /* x */',
	'select `select`, `a``b` from `t``x`',
	'select * from t where id = 1 for update skip locked',
	'select * from t lock in share mode',
	"select 18446744073709551615, 0xFF, x'0a', b'01', _utf8mb4'x' collate utf8mb4_bin, date '2020-01-01', 'it''s', 'a\\nb', 1.5e3, .5",
	'select not a = 1, !a, -a, ~a, a div 2, a mod 2, a ^ b, a << 1, a | b & c, binary a, a xor b from t',
	'select * from t where a between 1 and 10 and b not between 1 and 2 and c not in (select x from y) and d = any (select x from y)',
	'select * from t where a like "x!%" escape "!" and b regexp "^a" and c not rlike "b" and a <=> null and a is unknown and 1 member of (j)',
	'select * from t where match (a, b) against ("x" in boolean mode)',
	'select * from t where (a, b) in ((1, 2), (3, 4)) and (a or b) and not (c and d)',
	'select if(a, left(b, 1), right(b, 1)), replace(a, "x", "y"), mod(a, 2) from t',
	'select a from t into outfile "/tmp/x" fields terminated by ","',
	'select a into @x from t',
	'explain format=json select 1',
	'desc t',
	'use db',
	'set @a = 1, sql_mode = "x", global max_connections = 10, @@session.autocommit = on',
	'truncate table t',
	'drop temporary table if exists a, db.b',
	'drop database x',
];

const DorisExamples = [
	'select * from t lateral view explode(arr) tmp as c where x = 1',
	'select * from ctl.db.t partition (p1, p2) tablet (1001) a left semi join [shuffle] b on a.id = b.id',
	'select * from t temporary partition (tp1) right anti join s on t.id = s.id full outer join u on u.id = t.id',
	'insert overwrite table t partition(p1) with label l1 select * from s',
	'select array_map(x -> x + 1, [1,2,3]), array_filter((x, y) -> x > y, a, b), m["k"], arr[1] from t',
	'select a from t1 minus select a from t2',
	'select a, b, sum(c) from t group by grouping sets ((a, b), (a), ()) order by a nulls last',
	'select a from t group by rollup(a, b)',
	'select * from numbers("number" = "10") as n',
	'update t set a = 1 from s where t.id = s.id',
	'delete from t partition p1 using s where t.id = s.id',
	'select a from t into outfile "s3://bucket/x" format as csv properties ("s3.endpoint" = "x")',
	'explain verbose select 1',
];

const AuditStatementExamples = [
	'create table dst (id int) as select id from src',
	'create table if not exists dst engine=olap as select * from src',
	'create table dst select id from src',
	'create table dst like src',
	'create view v as select id from src',
	'create or replace view v (id) as select id from src',
	'create database if not exists app',
	'create unique index ix on dst (id)',
	'create fulltext index ix using btree on dst (text_col)',
	'alter table dst add column created_at timestamp',
	'alter table dst rename to dst_new',
	'alter table dst exchange partition p1 with table src',
	"load data local infile '/tmp/a.csv' replace into table dst partition (p1) fields terminated by ','",
	"load data low_priority infile '/tmp/a.csv' into table dst fields terminated by '\\n' set d = sleep(5), x = (select max(id) from secret)",
	'rename table old_t to new_t, db.a to db.b',
	'lock tables dst read, src low_priority write',
	'lock table dst as d read',
];

function roundtrip(sql: string, dialect: MysqlDialect) {
	const ast = parseMysql(sql, { dialect });
	const out = formatMysql(ast);
	let again: unknown;
	try {
		again = parseMysql(out, { dialect });
	} catch (e) {
		throw new Error(`Reparse failed: ${out}\n${e}`);
	}
	expect(again, out).toEqual(ast);
	return out;
}

describe('mysql', () => {
	test.each(MysqlExamples)('roundtrip %s', (sql) => {
		roundtrip(sql, 'mysql');
	});

	test.each(DorisExamples)('doris roundtrip %s', (sql) => {
		roundtrip(sql, 'doris');
	});

	test.each(AuditStatementExamples)('audit statement roundtrip %s', (sql) => {
		roundtrip(sql, 'mysql');
	});

	test.each(DorisExamples.filter((v) => !/rollup\(/.test(v)))('doris only syntax rejected by mysql %s', (sql) => {
		expect(() => parseMysql(sql)).toThrow();
	});

	test('ast follows miniquery shape', () => {
		expect(parseMysqlExpr('a > 1 and (b = 2 or c = 3) and d.e is not null')).toEqual({
			type: 'Logic',
			op: 'AND',
			exprs: [
				{ type: 'Compare', op: '>', left: { type: 'Column', name: 'a' }, right: { type: 'Literal', value: 1 } },
				{
					type: 'Logic',
					op: 'OR',
					exprs: [
						{ type: 'Compare', op: '=', left: { type: 'Column', name: 'b' }, right: { type: 'Literal', value: 2 } },
						{ type: 'Compare', op: '=', left: { type: 'Column', name: 'c' }, right: { type: 'Literal', value: 3 } },
					],
				},
				{
					type: 'Compare',
					op: 'IS NOT',
					left: { type: 'Column', table: 'd', name: 'e' },
					right: { type: 'Literal', value: null },
				},
			],
		});
		expect(parseMysqlExpr('a not between 1 and 2')).toEqual({
			type: 'Between',
			not: true,
			expr: { type: 'Column', name: 'a' },
			low: { type: 'Literal', value: 1 },
			high: { type: 'Literal', value: 2 },
		});
		expect(parseMysqlExpr('a in (1) and b not in (select 1) and not exists (select 1)')).toEqual({
			type: 'Logic',
			op: 'AND',
			exprs: [
				{ type: 'In', expr: { type: 'Column', name: 'a' }, list: [{ type: 'Literal', value: 1 }] },
				{
					type: 'In',
					not: true,
					expr: { type: 'Column', name: 'b' },
					query: { type: 'Select', columns: [{ expr: { type: 'Literal', value: 1 } }] },
				},
				{
					type: 'Unary',
					op: 'NOT',
					expr: { type: 'Exists', query: { type: 'Select', columns: [{ expr: { type: 'Literal', value: 1 } }] } },
				},
			],
		});
	});

	test('statements', () => {
		expect(parseMysql('select a from t where id = ?; ; show tables')).toEqual([
			{
				type: 'Select',
				columns: [{ expr: { type: 'Column', name: 'a' } }],
				from: [{ type: 'Table', name: 't' }],
				where: { type: 'Compare', op: '=', left: { type: 'Column', name: 'id' }, right: { type: 'Param', index: 0 } },
			},
			{ type: 'Unknown', keyword: 'SHOW', text: 'show tables' },
		]);
	});

	test('errors', () => {
		for (const sql of [
			'select from t',
			'delete from',
			'select * from t where',
			'update t where a = 1',
			'select a b c from t',
			'insert into t values (1',
		]) {
			expect(() => parseMysql(sql), sql).toThrow();
		}
	});

	test('executable comments', () => {
		expect(parseMysql('/*!40101 SET NAMES utf8 */; select /*! sleep(1), */ 1 /* x */')).toMatchObject([
			{ type: 'Unknown', keyword: 'SET' },
			{ type: 'Select', columns: [{ expr: { type: 'Func', name: 'sleep' } }, { expr: { type: 'Literal', value: 1 } }] },
		]);
		expect(parseMysql("select '/*!x */'", { executableComments: true })).toMatchObject([
			{ columns: [{ expr: { value: '/*!x */' } }] },
		]);
		expect(parseMysql('select /*! sleep(1), */ 1', { executableComments: false })[0]).toMatchObject({
			columns: [{ expr: { value: 1 } }],
		});
	});

	test('analyze', () => {
		const pick = (sql: string, dialect?: MysqlDialect) =>
			analyzeMysql(sql, { dialect }).map(({ statement, ...rest }) => rest);

		expect(
			pick('with c as (select * from src) insert into db.dst select * from c join other o on o.id = c.id'),
		).toEqual([
			{
				type: 'Insert',
				tables: [
					{ name: 'src', access: 'read' },
					{ db: 'db', name: 'dst', access: 'write' },
					{ name: 'other', access: 'read' },
				],
				functions: [],
				risks: [],
			},
		]);
		expect(
			pick(
				'update t1 a join t2 b on a.id = b.id set a.x = b.x; delete from t; delete x from t1 x join t2 on 1 where sleep(1)',
			),
		).toEqual([
			{
				type: 'Update',
				tables: [
					{ name: 't1', access: 'write' },
					{ name: 't2', access: 'read' },
				],
				functions: [],
				risks: ['no-where'],
			},
			{ type: 'Delete', tables: [{ name: 't', access: 'write' }], functions: [], risks: ['no-where'] },
			{
				type: 'Delete',
				tables: [
					{ name: 't1', access: 'write' },
					{ name: 't2', access: 'read' },
				],
				functions: ['SLEEP'],
				risks: ['dangerous-function'],
			},
		]);
		expect(
			pick('select * from t into outfile "/tmp/x"; drop table t; grant all on *.* to x').map((v) => v.risks),
		).toEqual([['into-file'], ['drop'], ['unknown-statement']]);
		// unqualified SET columns in multi-table update mark every table written
		expect(pick('update t1 join t2 on t1.id = t2.id set a = 1')[0].tables.map((v) => v.access)).toEqual([
			'write',
			'write',
		]);
		const audit = pick(AuditStatementExamples.join('; '));
		expect(audit.map((v) => v.type)).toEqual([
			'Create',
			'Create',
			'Create',
			'Create',
			'Create',
			'Create',
			'Create',
			'CreateIndex',
			'CreateIndex',
			'AlterTable',
			'AlterTable',
			'AlterTable',
			'LoadData',
			'LoadData',
			'Rename',
			'LockTables',
			'LockTables',
		]);
		expect(audit[3].tables).toEqual([
			{ name: 'dst', access: 'write' },
			{ name: 'src', access: 'read' },
		]);
		expect(audit[8].tables).toEqual([{ name: 'dst', access: 'write' }]);
		expect(audit[11].tables).toEqual([
			{ name: 'dst', access: 'write' },
			{ name: 'src', access: 'write' },
		]);
		expect(audit[13]).toMatchObject({
			tables: [
				{ name: 'dst', access: 'write' },
				{ name: 'secret', access: 'read' },
			],
			functions: ['SLEEP', 'MAX'],
			risks: ['load-data', 'dangerous-function'],
		});
		// CTE names only shadow within their own subtree
		expect(pick('select * from (with t as (select 1) select * from t) y, t')[0].tables).toEqual([
			{ name: 't', access: 'read' },
		]);
	});

	test('locations', () => {
		const sql = 'select a + 1 as x from t join s on t.id = s.id where b between 1 and 2 and c in (1, 2); use db';
		const [stmt, use] = parseMysql(sql, { locations: true });
		const text = (n: any) => sql.slice(n.loc.start, n.loc.end);
		const nodes: string[] = [];
		visitMysql(stmt, (n) => {
			if (n.loc) nodes.push(`${n.type}:${text(n)}`);
		});
		expect(nodes).toContain('Binary:a + 1');
		expect(nodes).toContain('Between:b between 1 and 2');
		expect(nodes).toContain('In:c in (1, 2)');
		expect(nodes).toContain('Logic:b between 1 and 2 and c in (1, 2)');
		expect(nodes).toContain('Compare:t.id = s.id');
		expect(nodes).toContain('Table:s');
		expect(text(stmt)).toBe(sql.slice(0, sql.indexOf(';')));
		expect(text(use)).toBe('use db');
		// off by default
		expect(JSON.stringify(parseMysql(sql))).not.toContain('"loc"');
	});

	test('names', () => {
		expect(parseMysqlExpr('db.t.c + t.* ')).toMatchObject({
			left: { type: 'Column', db: 'db', table: 't', name: 'c' },
		});
		expect(parseMysql('select t.*, db.fn(1) from db.t')[0]).toMatchObject({
			columns: [{ expr: { type: 'Star', table: 't' } }, { expr: { type: 'Func', db: 'db', name: 'fn' } }],
			from: [{ type: 'Table', db: 'db', name: 't' }],
		});
		expect(parseMysql('select ctl.db.t.c from ctl.db.t; use ctl.db', { dialect: 'doris' })).toMatchObject([
			{
				columns: [{ expr: { type: 'Column', catalog: 'ctl', db: 'db', table: 't', name: 'c' } }],
				from: [{ type: 'Table', catalog: 'ctl', db: 'db', name: 't' }],
			},
			{ type: 'Use', catalog: 'ctl', db: 'db' },
		]);
		for (const sql of ['select * from ctl.db.t', 'select ctl.db.t.c from t', 'use ctl.db']) {
			expect(() => parseMysql(sql), sql).toThrow();
		}
		expect(analyzeMysql('select db.sleep(1)')[0]).toMatchObject({ functions: ['db.SLEEP'], risks: [] });
	});

	test('mysql specifics', () => {
		expect(parseMysql("select 'a' 'b'")[0]).toMatchObject({ columns: [{ expr: { value: 'ab' } }] });
		expect(() => parseMysql('select 1 from t where a in ()')).toThrow();
		expect(parseMysql('select data, tables, local, status, comment from data')).toMatchObject([
			{
				columns: [
					{ expr: { type: 'Column', name: 'data' } },
					{ expr: { type: 'Column', name: 'tables' } },
					{ expr: { type: 'Column', name: 'local' } },
					{ expr: { type: 'Column', name: 'status' } },
					{ expr: { type: 'Column', name: 'comment' } },
				],
				from: [{ type: 'Table', name: 'data' }],
			},
		]);
		// `FROM DUAL` is a keyword, `` `dual` `` a table; Doris keeps parsing dual as a table name
		expect(parseMysql('select 1 from dual')).toMatchObject([{ from: [{ type: 'Table', name: 'dual', dual: true }] }]);
		expect(parseMysql('select 1 from `dual`')[0]).not.toMatchObject({ from: [{ dual: true }] });
		expect(formatMysql(parseMysql('select 1 from `dual`'))).toBe('SELECT 1 FROM `dual`');
		expect(parseMysql('select * from dual d', { dialect: 'doris' })).toMatchObject([
			{ from: [{ type: 'Table', name: 'dual', alias: 'd' }] },
		]);
		// a quoted function name calls a stored function and stays quoted
		expect(parseMysql('select `count`(1, 2)')).toMatchObject([
			{ columns: [{ expr: { name: 'count', quoted: true } }] },
		]);
		expect(formatMysql(parseMysql('select `count`(1, 2)'))).toBe('SELECT `count`(1, 2)');
		// whitespace keeps a space-sensitive built-in an ordinary call; special syntax stays with the built-in
		expect(formatMysql(parseMysql('select count (1, 2)'))).toBe('SELECT count (1, 2)');
		expect(formatMysql(parseMysql('select `position`(1, 2)'))).toBe('SELECT `position`(1, 2)');
		// Doris marks a bare `dual` like MySQL's keyword, so the analyzer skips it in both dialects
		expect(analyzeMysql('select 1 from dual', { dialect: 'doris' })[0].tables).toEqual([]);
		expect(analyzeMysql('select 1 from dual')[0].tables).toEqual([]);
		expect(analyzeMysql('select 1 from `dual`')[0].tables).toEqual([{ name: 'dual', access: 'read' }]);
		// READ / WRITE are reserved in MySQL 8.4; quoted or qualified they are ordinary names
		expect(() => parseMysql('select read, write from data')).toThrow();
		expect(parseMysql('select `read`, data.write from data')).toMatchObject([
			{ columns: [{ expr: { name: 'read' } }, { expr: { table: 'data', name: 'write' } }] },
		]);
		expect(formatMysql(parseMysql("load data infile 'f' into table t lines terminated by '\\n'"))).toContain(
			"lines terminated by '\\n'",
		);
		for (const sql of [
			'create index ix using btree on t',
			'create fulltext ix on t (a)',
			"load data infile 'f' intotable t",
			'rename table a b',
			'lock tables t',
			'alter table t',
			'alter table t rename to',
			'alter table t exchange partition p1 with',
			'alter table t rename column',
			'create table t like',
			'create table t nonsense',
			'create database d junk',
			'create nonsense view v as select 1',
			'create index i on t (a) garbage',
		]) {
			expect(() => parseMysql(sql), sql).toThrow();
		}
		expect(() => parseMysql('create database ctl.db')).toThrow();
		const view = 'create algorithm=merge sql security invoker view v as select * from src with cascaded check option';
		expect(parseMysql(formatMysql(parseMysql(view)))).toEqual(parseMysql(view));
		for (const sql of [
			'create index i on t (a) using btree comment "x" algorithm=inplace lock=none visible',
			'create definer=`u`@`%` view v as select * from src',
			'alter table t add c int, rename to t2',
			'alter table t rename to t2, add c int',
			'alter table t rename t2',
			'alter table t rename column a to b',
			'alter table t exchange partition p1 with table t2 without validation',
		]) {
			roundtrip(sql, 'mysql');
		}
		expect(
			analyzeMysql('alter table t add c int, rename to t2; alter table t exchange partition p with table t2')[0],
		).toMatchObject({
			tables: [
				{ name: 't', access: 'write' },
				{ name: 't2', access: 'write' },
			],
		});
		expect(analyzeMysql('alter table t add constraint fk foreign key (a) references other.p(id)')[0].tables).toEqual([
			{ name: 't', access: 'write' },
			{ db: 'other', name: 'p', access: 'read' },
		]);
		expect(analyzeMysql('create table t (id int, foreign key (p) references other.parent(id))')[0].tables).toEqual([
			{ name: 't', access: 'write' },
			{ db: 'other', name: 'parent', access: 'read' },
		]);
		expect(formatMysql(parseMysql('alter ignore table t add c int'))).toBe('ALTER IGNORE TABLE t add c int');
		expect(formatMysql(parseMysql("alter table t comment 'a  b'"))).toContain("comment 'a  b'");
		expect(() => parseMysql('create algorithm=bogus view v as select 1')).toThrow();
		expect(() => parseMysql('alter table t add c int rename to x')).toThrow();
	});
});
