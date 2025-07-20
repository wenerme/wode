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
- src/doc
  - Document Query
  - MongoDB like query DSL
  - best for intermediate representation structured query
  - format to SQL/MiniQuery then processed by src/ast or src/mikro-orm
