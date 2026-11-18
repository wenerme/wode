# SQL corpus

These are executable test fixtures for the grammar implemented by this package.
They cover supported syntax, AST node families, audit results, comments, dialect
boundaries, and explicit rejection cases. They are not a complete conformance
suite for every MySQL/Doris server version, and they are never executed against
a database.

| File | Purpose |
| --- | --- |
| `test.mysql.sql` | Valid native MySQL statements, expressions, comments and audit cases |
| `error.test.mysql.sql` | MySQL statements that must be rejected |
| `test.doris.sql` | Doris syntax, including cases that MySQL must reject |
| `test.miniquery.sql` | The original MiniQuery expression language, formatting and evaluation |
| `sql.test.ts` | Loads fixtures and checks parse/format/parse, expected results and node coverage |

The current corpus has 717 cases: MySQL 334 positive cases in `test.mysql.sql`
and 324 rejection cases in `error.test.mysql.sql`, Doris 21 positive / 9
rejection cases, and MiniQuery 25 positive / 4 rejection cases. Nineteen Doris
cases also assert rejection under the MySQL dialect. The runner covers all 51
current SQL AST node kinds (including `QueryGroup`, `JsonTable`, `Script` and
`Comment`) and all nine MiniQuery expression node kinds; focused `src/` tests
provide additional checks, including `src/mysql/reserved.test.ts` for every
MySQL 8.4 reserved word in fourteen positions.

MySQL cases are checked against a real MySQL 8.4 server with the default
`sql_mode`: each statement is compiled with `PREPARE`, so nothing is executed.
A case is a rejection only when the server reports a syntax error (1064) or a
parse-time rule such as a misplaced or duplicate `INTO` (3953/3954) or a
derived table without an alias (1248). Errors that depend on schema or data,
such as an unknown table or column, mean the syntax is valid. The one
deliberate exception is `mysql-invalid-nested-executable-comment`: MySQL accepts
it, but the parser rejects nested markers inside executable comments so an
audit cannot miss hidden SQL. Most cases test one statement and one idea, so a
failure points at a single construct; `mysql-nearmiss-*` cases are valid
controls one token away from a rejected case. Syntax the parser does not match
yet is tracked as a known issue instead of being encoded as an expectation.

The check is repeatable with Docker (it is not part of `pnpm test`):

```sh
just mysql-oracle-up     # start mysql:8.4 and load tests/mysql-oracle.schema.sql
                         # (`just mysql-oracle-up NAME IMAGE` for another container name or image)
just mysql-oracle        # compare the parser with the server on both MySQL files
just mysql-oracle FILE   # statements in FILE, separated by lines containing only `----`
just mysql-oracle-down
```

`tests/mysqlOracle.ts` runs the server's own `mysql` client in the container, so
no extra dependency is needed. It reports statements the parser accepts but the
server rejects, the reverse, fixtures whose expectation disagrees with the
server, and parse/format round-trip failures. Use the native client or disable
`IGNORE_SPACE`: some drivers enable it, which changes function-call syntax.

Run `pnpm test:sql` for the corpus, or `pnpm test` for all package tests. Regenerate
all four Peggy parsers with `pnpm generate` or `just generate`; all generation
entry points are pinned to Peggy **5.1.1**. Existing focused tests for MiniQuery,
search, ORM conversion and MySQL remain in `src/`.

## Case format

```sql
-- @case select-active-orders
-- @expect {"types":["Select"],"tables":[{"name":"orders","access":"read"}],"risks":[]}
SELECT id, total
FROM orders
WHERE status = 'active';

-- @case reject-miniquery-list
-- @error
SELECT * FROM orders WHERE id IN [1, 2];
```

Only lines starting with `-- @case` delimit cases. The loader does **not** split
on semicolons, so a case may contain multiple statements, semicolons inside
strings/comments, or executable comments. The marker is reserved for fixture
headers and must not occur on its own line inside a SQL literal or comment.
Standalone lines beginning with `--` followed by `@` are reserved for metadata;
malformed or misplaced directives are rejected instead of becoming SQL comments.
These header comments are fixture metadata, not extensions to the SQL grammar.

Each case requires exactly one `@expect` or `@error`. MySQL `@expect` cases
belong in `test.mysql.sql` and `@error` cases in `error.test.mysql.sql`; a test
enforces the split and unique case names across files. Doris keeps both kinds in
`test.doris.sql`. For SQL fixtures:

- `types` is mandatory: the expected top-level statement type array using
  PascalCase AST names such as `Select`, `AlterTable`, and `SetOp`. An empty
  array explicitly tests a trivia-only script.
- `tables`, `risks`, `functions` are optional exact expectations for the flattened
  per-statement audit results, in traversal order. Empty arrays assert absence.
- `comments` optionally asserts the source-ordered comment kinds.
- `-- @options {"mysqlVersion":80400}` or
  `-- @options {"executableComments":false}` controls executable-comment parsing.
- `-- @mysql-reject` marks a valid Doris case that must fail under the MySQL dialect.
- `-- @error` requires a syntax error; a crash such as a TypeError does not count
  as a successful rejection test.

For MiniQuery fixtures, `@expect` uses `type` for the expression root, optional
`value`/`context` for evaluation, and optional `evaluationError` for operators
that parse successfully but are not implemented by the evaluator. Each body is
one expression; it is not a MySQL statement and must not end with a semicolon.

All successful SQL cases check semantic AST equality after formatting and parsing
again. Comments are checked separately against the original source because
moving hints or version guards would change their execution behavior. Additional
tests require the corpus to exercise every implemented SQL and MiniQuery node
type; the expected node sets are checked exhaustively by TypeScript as well.

Focused tests in `src/mysql/select.test.ts`, `select-options.test.ts` and
`json-table.test.ts` additionally assert set-operation tree shapes, preservation
of inner and outer query tails, INTO ownership and uniqueness, structured
clauses, JSON_TABLE columns, visitor reachability and dialect rejection. Tree
shape checks are necessary because a parser and formatter can share the same
precedence bug while still passing roundtrip tests.
