# MySQL and Doris SQL

This module parses a subset of native MySQL syntax for inspection and auditing.
It uses an independent AST and Peggy grammar. It does not add MiniQuery operators,
array syntax, or a custom hint language to MySQL. Doris-specific syntax requires
`{ dialect: 'doris' }`.

Parsing is not complete server validation: the supported grammar does not check
schema, permissions, installed engines/functions, or all version-specific syntax.
Some DDL definitions remain raw text, and unsupported statement families may
produce `Unknown` nodes. Do not use parse success alone as an authorization check.
The default lexical behavior follows MySQL without `ANSI_QUOTES` or
`NO_BACKSLASH_ESCAPES`; SQL mode configuration is not currently modeled.

All AST `type` discriminants are PascalCase string literals, such as `Select`,
`AlterTable`, `CreateIndex`, `SetOp`, `TableFunc`, and `Column`. They form TypeScript
discriminated unions; `analyzeMysql(...)[i].type` uses the same statement names.
When updating an existing consumer, change comparisons and persisted AST tags
such as `'alterTable'` to `'AlterTable'`.

### Constants

`src/mysql/ast/const.ts` defines every discriminant and fixed value as a const
object with a type of the same name, e.g. `ExprType`, `StatementType`,
`TableExprType`, `NodeType`, `SetOperator`, `JoinType`, `LockMode` and
`WindowFrameBoundKind`. Values are the plain strings stored in the AST, so
`node.type === ExprType.Column` and `node.type === 'Column'` are equivalent and
persisted ASTs are unaffected. `analyzeMysql` exports `MysqlRisk` and
`MysqlTableAccessMode` the same way. Compile-time checks in `types.ts` keep the
node unions and the `*Type` constants in sync.

The formatter is split by concern: `formatExpr.ts`, `formatTable.ts`,
`formatQuery.ts`, `formatStatement.ts` and `quote.ts`, with `formatMysql.ts` as
the entry point. The generated Peggy parser cannot import TypeScript, so the
grammar still writes these values as string literals.

## Query structure

The current development focus is one SELECT/query statement, including its
CTEs, subqueries, joins, expressions, windows and set operations.
`parseMysql` still returns a statement array. A query is a `Select`, `SetOp`, or
`QueryGroup`; the last preserves parentheses and the outer query's own clauses.

```ts
const [query] = parseMysql('(SELECT id FROM orders ORDER BY id LIMIT 1) ORDER BY id DESC LIMIT 5');
// QueryGroup { query: Select { orderBy: ..., limit: 1 }, orderBy: ..., limit: 5 }
```

`INTERSECT` binds more tightly than `UNION` and `EXCEPT`; operators at the same
level associate left to right. Doris uses the Nereids precedence rules, including
`MINUS` alongside `EXCEPT`. The legacy Doris planner's flat precedence is not
modeled. An `INTO` destination belongs to the complete query; duplicates and
destinations inside scalar subqueries, derived tables or CTEs are rejected.
An `INTO` written in the last query block of a query expression, even inside
parentheses or before the outer `ORDER BY` / `LIMIT`, applies to the final
result of the whole statement (MySQL 8.4 accepts these with deprecation warning
3962), so the parser moves it to the outermost query node. `INTO` in any other
query block is rejected (MySQL error 3954), as is a second `INTO` (3953).

Query clauses now expose structured records:

| Field                | Structure                                                                               |
| -------------------- | --------------------------------------------------------------------------------------- |
| `WindowSpec.frame`   | `unit`, `start`, optional `end`; an offset bound contains an `Expr`                     |
| `Select.locking`     | Ordered clauses with `mode`, qualified `tables`, `wait`, and optional `legacy` spelling |
| `Table.indexHints`   | `kind`, optional `scope`, and case-preserving `indexes`                                 |
| `IntoClause.options` | MySQL charset/field/line options, or Doris format and string properties                 |
| `Select.qualify`     | Doris filter expression, visited like WHERE/HAVING                                      |
| `JsonTable`          | Input expression, JSON path, required alias, and recursive column definitions           |

Consumers of earlier ASTs must migrate the string-valued `Select.lock` to
`Select.locking`, and the previously string-valued frame, index-hint and export
fields to these records. `QueryGroup` and `JsonTable` also extend the node union.
The visitor reaches expressions inside query groups, window bounds, QUALIFY and
JSON_TABLE inputs. It does not treat column definitions or option records as
independent AST nodes.

`Param.index` follows placeholder order in the source, including when parsing
backtracks through parentheses. Formatting retains the binding order of
parameterized `LIMIT offset, count` clauses. Query locations include their own
WITH and tail clauses; intermediate set nodes cover only their operands.

`JSON_TABLE` models ordinality, typed paths, EXISTS paths, nested columns, and
ON EMPTY/ON ERROR responses. It follows the documented optional `PATH` after
`NESTED`; MySQL 8.4's yacc grammar requires that keyword. Data type parameters,
JSON values/paths, window ordering requirements and function signatures are not
fully validated against a server. MySQL JSON_TABLE syntax and Doris QUALIFY are
enabled only in their respective dialects.
Locking clauses outside a parenthesized query, such as
`(SELECT * FROM t) FOR UPDATE`, remain unsupported.

## MySQL syntax rules

The MySQL dialect follows the MySQL 8.4 grammar with the default `sql_mode`, as
checked against a server (see `tests/README.md`):

- **Reserved words.** All 262 reserved words of MySQL 8.4 are rejected as bare
  column names, aliases and table names, except literals and niladic functions
  such as `NULL` and `CURRENT_DATE`. Backticked or written directly after a dot
  (`t.select`) they are ordinary names; after a dot and whitespace (`t. select`)
  they are not. Reserved words that are built-in functions (`IF`, `LEFT`,
  `REPLACE`, `CHAR`, `RANK`, ...) are accepted with their fixed argument count.
- **Predicates.** `IN`, `BETWEEN`, `LIKE`, `REGEXP` and `MEMBER OF` do not
  chain (`a LIKE b LIKE c` is invalid) but may be compared (`a LIKE b = c`).
  `IS [NOT] NULL` may repeat; `IS [NOT] TRUE|FALSE|UNKNOWN` applies once, above
  comparisons. A `LIKE` pattern or `ESCAPE` is a simple expression. `ANY`,
  `SOME` and `ALL` take a subquery.
- **Functions.** Aggregates accept `DISTINCT` only where MySQL does, `*` only in
  `COUNT(*)` and `ORDER BY` / `SEPARATOR` only in `GROUP_CONCAT`. Window
  functions require `OVER`, which is rejected after other functions; offsets and
  bucket counts are integer constants or `?`. `CAST` / `CONVERT` accept MySQL's
  target types (`SIGNED [INT]`, `CHAR(n) CHARSET x`, `DECIMAL(m, d)`, ...,
  optionally `ARRAY`), not column types such as `INT` or `VARCHAR`.
  Space-sensitive built-ins (`COUNT`, `SUM`, `CAST`, `TRIM`, `DATE_ADD`, ...)
  lose their special syntax when `(` does not directly follow the name, as
  without `IGNORE_SPACE`.
- **INTERVAL** is only an operand of `+` / `-` (`d + INTERVAL 1 DAY`,
  `INTERVAL 1 DAY + d`) or the second argument of `DATE_ADD`, `DATE_SUB`,
  `ADDDATE` and `SUBDATE`; `DATE_ADD` and `DATE_SUB` require it.
- **Other rules.** `->` / `->>` follow a column reference once. A bare `*` is
  only the first select item. `FROM DUAL` stands alone. `LEFT` / `RIGHT` joins
  need `ON` or `USING`, `NATURAL` joins take neither. `LIMIT` and `OFFSET` are
  integer literals or `?`. Derived tables need an alias. `USE INDEX` and
  `FORCE INDEX` can not be combined. `X'..'` needs an even number of hex digits.

The Doris dialect keeps its previous reserved words and does not apply the
MySQL-only function, CAST and space rules.

Three AST fields keep these distinctions through formatting: `Table.dual` marks
the `DUAL` keyword (a quoted `` `dual` `` is a real table and is reported by
`analyzeMysql`); `Func.quoted` marks a quoted name, which calls a stored
function rather than the built-in; `Func.spaced` marks a space-sensitive
built-in written with whitespace before `(`, which MySQL parses as an ordinary
call. Doris also marks an unquoted, unqualified `dual` table.

## Statements and comments

```ts
import { analyzeMysql, parseMysqlScript, visitMysql } from '@wener/miniquery/mysql';

const sql = 'SELECT /*+ MAX_EXECUTION_TIME(1000) */ * FROM orders /*!80000 WHERE id > 0 */';
const script = parseMysqlScript(sql, { mysqlVersion: 80400 });

script.type; // 'Script'
script.statements; // parsed SQL statements, including active executable payloads
script.comments; // CommentNode[], in source order

visitMysql(script, (node) => {
	if (node.type === 'Comment') {
		console.log(node.kind, node.raw, sql.slice(node.loc.start, node.loc.end));
	}
});

analyzeMysql(script); // analyzes the semantic statements in this result
```

`CommentNode` has `type: 'Comment'`, `kind`, `raw`, `value`, and `loc`:

| Kind         | Native syntax                     | Interpretation                                                                    |
| ------------ | --------------------------------- | --------------------------------------------------------------------------------- |
| `block`      | `/* content */`                   | Ordinary block comment                                                            |
| `line`       | `# content`, `-- content`         | Ends before CR/LF; `--` requires following whitespace/control or the end of input |
| `hint`       | `/*+ MAX_EXECUTION_TIME(1000) */` | Optimizer hint; content is preserved, not interpreted as custom syntax            |
| `executable` | `/*! SQL */`, `/*!80000 SQL */`   | MySQL executable comment, optionally guarded by server version                    |

`raw` includes delimiters. `value` omits delimiters and recognized marker/version
prefixes. `loc` always contains UTF-16 offsets into the original input, even when
`locations` is disabled. Executable comments may also have `version` and `body`,
the range of their SQL payload. Pure-comment scripts retain all comments and have
an empty `statements` array. Comments inside nested queries and DDL are collected
once at the script level; offsets identify their original placement.

`scanMysqlComments(sql)` performs only the shared Peggy lexical pass, so it can
also inspect statements outside the modeled grammar. Quoted strings/identifiers
are skipped; malformed or unterminated lexical tokens throw.

`parseMysql(sql)` keeps the existing `Statement[]` API. It uses the same pipeline,
but returns only `script.statements`. Use `parseMysqlScript` to retain trivia.

## Executable comments

Executable payloads are included by default for auditing. Supply `mysqlVersion`
as MySQL's numeric version encoding (`80400` for 8.4.0) to honor version guards.
Without it, all recognized executable payloads are included conservatively;
this does not predict execution on an unspecified server. Set
`executableComments: false` to leave all executable payloads opaque. The script
still retains their comment nodes in either mode.

Expansion replaces only delimiters and version prefixes with spaces. Original
UTF-16 offsets and line endings remain aligned. `parseMysqlExpr` uses the same
policy as statement parsing. `expandExecutableComments(sql, mysqlVersion?)` is
also available separately.

Executable blocks containing another `/*` marker are conservatively rejected.
MySQL has version-dependent, deprecated nested-comment behavior; flattening a
truncated wrapper could hide executable SQL from an audit. This parser does not
attempt to emulate that behavior.

## Formatting boundary

`formatMysql(comment)` reproduces the comment's exact `raw` text.
`formatMysql(statements)` formats only the semantic statements. It does not
restore comments, hints, or version guards that were removed during parsing.
It should not be used to execute a rewritten version of a commented script.

The formatter does not accept a `MysqlScript`: moving an inline optimizer hint
or turning version-guarded SQL into unconditional SQL changes its meaning.
For inspection or source edits, retain the original SQL and use comment offsets.
SQL containing comments can be audited through `analyzeMysql(script)` without
formatting it first.

Grammar generation: run `make gen` in `src/mysql/ast` (Peggy 5.1.1), or
`just generate` from the package directory to regenerate all four parsers.

Reference: [MySQL 8.4 comment syntax](https://dev.mysql.com/doc/refman/8.4/en/comments.html).
