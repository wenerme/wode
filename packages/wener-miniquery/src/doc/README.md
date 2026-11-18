# Document query

Convert a Mongo-like filter to MiniQuery.

```ts
import { documentQueryToExpr, formatDocumentQuery } from '@wener/miniquery/doc';

formatDocumentQuery({ status: 'active', 'profile.age': { $gte: 18 }, $or: [{ a: 1, b: 2 }, { c: 3 }] });
// ['((a = 1 AND b = 2) OR c = 3)', 'profile.age >= 18', 'status = "active"']

documentQueryToExpr({ a: 1 }); // { type: 'compare', op: '=', left: { type: 'ref', value: ['a'] }, ... }
```

- `documentQueryToExpr(query, options?)` returns one MiniQuery expression (`Expr` from `@wener/miniquery/ast`),
  or `undefined` when the query has no condition.
- `formatDocumentQuery(query, options?)` returns the top-level conditions as MiniQuery text, to be combined
  with AND. Each string parses with `parseQuery`.
- `documentQueryConditions(query, options?)` returns the top-level conditions as expressions.

Conditions come out in key order.

For compatibility, `formatDocumentQuery` and `documentQueryConditions` also accept a root list of query objects;
the list is expanded in order. `documentQueryToExpr` expects one query object and returns one expression.

## Migration: `$text.onSearch`

The old formatter option was callback-oriented and exposed a mutable `filters` array:

```ts
// old
formatDocumentQuery(query, {
	onSearch(search, { filters }) {
		filters.push(`title ~ "${search}"`);
	},
});
```

The converter now builds an AST, so `onSearch` must return the expression to insert. Return `undefined` to skip
the text condition. This avoids string escaping and lets the normal MiniQuery formatter validate the result:

```ts
// new
formatDocumentQuery(query, {
	onSearch(search) {
		return {
			type: 'func',
			name: 'search',
			args: [{ type: 'literal', value: search }],
		};
	},
});
```

## Queries

| Query                                                                                        | MiniQuery                                  |
| -------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `{ a: 1 }`, `{ a: { $eq: 1 } }`                                                              | `a = 1`                                    |
| `{ a: null }`, `{ a: { $ne: null } }`                                                        | `a IS NULL`, `a IS NOT NULL`               |
| `{ a: { $gt: 1, $lte: 5 } }` (`$gt` `$gte` `$lt` `$lte` `$ne`)                               | `a > 1`, `a <= 5`                          |
| `{ a: [1, 2] }`, `{ a: { $in: [1, 2] } }`, `$nin`                                            | `a IN (1, 2)`, `a NOT IN (...)`            |
| `{ a: { $in: [1, null] } }`                                                                  | `(a IN (1) OR a IS NULL)`                  |
| `{ a: { $like: '%x%' } }`, `$nlike`                                                          | `a LIKE "%x%"`                             |
| `{ a: { $regex: '^x' } }`, `{ a: /^x/ }`                                                     | `a ~ "^x"`                                 |
| `{ a: { $exists: true } }`                                                                   | `a IS NOT NULL`                            |
| `{ tags: { $size: 2 } }`                                                                     | `LENGTH(tags) = 2`                         |
| `{ tags: { $all: ['x'] } }`                                                                  | `tags @> ["x"]`                            |
| `{ a: { $not: { $gt: 5 } } }`, `{ $not: { a: 1 } }`                                          | `(NOT a > 5)`                              |
| `{ $and: [...] }`, `$or`, `$nor` (a list, or a record of named groups)                       | `AND`, `OR`, `NOT (... OR ...)`            |
| `{ profile: { age: 1 } }`, `{ 'profile.age': 1 }`                                            | `profile.age = 1`                          |
| `{ profile: { $or: [{ age: 1 }, { age: 2 }] } }`, `{ a: { $or: [{ $gt: 1 }, { $lt: 0 }] } }` | groups under a field                       |
| `{ $text: { $search: 'x' } }`                                                                | the `onSearch(search)` option's expression |

`$comment` is the standard MongoDB query metadata operator. It is ignored by the converter and can be placed
alongside conditions, in a nested query, or in a field operator object. Its value is not validated because it does
not affect filtering. `$$...` keys are the extension metadata namespace; in particular `$$disable: true` skips the
object containing it.

Values are strings, numbers, booleans, `null`, `Date` (as an ISO string) and safe `bigint`s. An empty group in
`$or` matches everything; in `$nor` it matches nothing (`FALSE`). Keys starting with `$$` are ignored, and an
object with `$$disable: true` (`DisableKey`) is skipped, e.g. a filter group switched off in a UI: put it inside
the group (`{ $or: { adults: { $$disable: true, ... } } }`). `$$` keys directly on a record of groups are also
ignored at runtime but are not typed, so that every group value is still checked as a query.

## Semantics and limits

The result follows SQL when the generated expression is executed by SQL: `$ne` and `$nin` do not match `NULL`
(Mongo also matches missing fields), `$exists` does not tell a missing field from `null`, and an array value is
`IN` (Mongo matches an equal array). The in-memory `resolveQuery` evaluator uses JavaScript's two-valued
semantics, so its treatment of `NULL`/`undefined` may differ from SQL. A nested object addresses nested fields
rather than matching a whole embedded document.

The converter can emit `LIKE`, regular-expression (`~`), `LENGTH` (`$size`) and array-containment (`@>` / `$all`)
expressions. The default `resolveQuery` evaluator does not implement those four MiniQuery operations; use the SQL
formatter or a resolver with matching function/operator support when executing them.

Rejected with an error instead of producing a wrong condition:

- names MiniQuery can not write: fields such as `_id`, keywords (`end`), numeric segments (`tags.0`)
  (names that only start like a literal, such as `trueValue` or `nullish`, are fine);
- strings containing both `"` and `'` (MiniQuery strings have no escapes), non-finite numbers, unsafe `bigint`s,
  objects other than plain objects, `Date`, `RegExp`;
- `$elemMatch`, `$type`, `$expr`, `$where`, `$regex` options and RegExp flags, `$text` without `onSearch`.
