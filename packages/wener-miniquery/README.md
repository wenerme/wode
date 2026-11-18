SQL Where like **safe** filter expression for ORM.

- Impl 1% of SQL to support 99% of use cases.
- Reference
  - [MiniQuery](https://wener.me/notes/languages/miniquery)

**Structure**

- src/ast
  - AST based parse/format/eval
- src/mikro-orm
  - MikroORM based query builder
  - SQL to MikroORM [Query Builder](https://mikro-orm.io/docs/query-builder)
- src/mysql
  - MySQL / Apache Doris statement parser (peggy) for audit, parsing and validation
  - `parseMysql(sql, { dialect: 'mysql' | 'doris' })`, `formatMysql`, `analyzeMysql`, `visitMysql`
  - independent AST under `src/mysql/ast`, following the package's plain-object node design pattern
  - includes structured DDL/data access for CREATE, ALTER, LOAD DATA, RENAME and LOCK TABLES
  - native SQL syntax only; Doris extensions require `dialect: 'doris'`
  - `parseMysqlScript` captures comment nodes, optimizer hints and executable version comments; see [MySQL API](src/mysql/README.md)
- src/doc
  - Document Query
  - MongoDB like query DSL
  - best for intermediate representation structured query
  - format to SQL/MiniQuery then processed by src/ast or src/mikro-orm

**Development**

- `pnpm generate` / `just generate`: regenerate MiniQuery, search, MikroORM and MySQL parsers using Peggy 5.1.1.
- `pnpm test:sql`: run the readable [SQL corpus](tests/README.md), including MySQL, Doris and MiniQuery fixtures.
- `pnpm test`: run all package tests, including the SQL corpus and ORM integration tests.
