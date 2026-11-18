-- @case mysql-invalid-missing-select-projection
-- @error
SELECT FROM orders;

-- @case mysql-invalid-duplicate-into
-- @error
SELECT id INTO @a FROM orders INTO @b;

-- @case mysql-invalid-into-in-subquery
-- @error
SELECT (SELECT id INTO @a FROM orders);

-- @case mysql-invalid-into-before-set-operation
-- @error
SELECT 1 INTO @a UNION SELECT 2;

-- @case mysql-invalid-json-table-missing-alias
-- @error
SELECT * FROM JSON_TABLE('[1,2]', '$[*]' COLUMNS (id INT PATH '$'));

-- @case mysql-invalid-json-table-empty-columns
-- @error
SELECT * FROM JSON_TABLE('[1,2]', '$[*]' COLUMNS ()) jt;

-- @case mysql-invalid-delete-without-target
-- @error
DELETE FROM;

-- @case mysql-invalid-empty-where
-- @error
SELECT * FROM orders WHERE;

-- @case mysql-invalid-update-without-set
-- @error
UPDATE orders WHERE id = 1;

-- @case mysql-invalid-multiple-unseparated-aliases
-- @error
SELECT id first_alias second_alias FROM orders;

-- @case mysql-invalid-unclosed-values-row
-- @error
INSERT INTO orders VALUES (1;

-- @case mysql-invalid-empty-in-list
-- @error
SELECT * FROM orders WHERE id IN ();

-- @case mysql-unsupported-double-equals-operator
-- @error
SELECT * FROM orders WHERE id == 1;

-- @case mysql-unsupported-containment-operator
-- @error
SELECT * FROM events WHERE payload @> [1];

-- @case mysql-unsupported-ilike-operator
-- @error
SELECT * FROM orders WHERE note ILIKE 'pending%';

-- @case mysql-unsupported-bracket-in-list
-- @error
SELECT * FROM orders WHERE id IN [1, 2];

-- @case mysql-unsupported-array-literal
-- @error
SELECT [1, 2];

-- @case mysql-unsupported-catalog-qualified-table
-- @error
SELECT * FROM warehouse.shop.orders;

-- @case mysql-unsupported-catalog-qualified-column
-- @error
SELECT warehouse.shop.orders.id FROM orders;

-- @case mysql-unsupported-catalog-qualified-use
-- @error
USE warehouse.shop;

-- @case mysql-unsupported-catalog-qualified-create-database
-- @error
CREATE DATABASE warehouse.shop;

-- @case mysql-invalid-create-index-without-columns
-- @error
CREATE INDEX ix_order USING BTREE ON orders;

-- @case mysql-invalid-fulltext-without-index-keyword
-- @error
CREATE FULLTEXT ix_body ON articles (body);

-- @case mysql-invalid-load-data-fused-keywords
-- @error
LOAD DATA INFILE '/tmp/orders.csv' INTOTABLE orders;

-- @case mysql-invalid-rename-without-to
-- @error
RENAME TABLE orders archived_orders;

-- @case mysql-invalid-lock-without-mode
-- @error
LOCK TABLES orders;

-- @case mysql-invalid-alter-rename-without-target
-- @error
ALTER TABLE orders RENAME TO;

-- @case mysql-invalid-alter-exchange-without-table
-- @error
ALTER TABLE orders EXCHANGE PARTITION p2024 WITH;

-- @case mysql-invalid-alter-rename-column-without-names
-- @error
ALTER TABLE orders RENAME COLUMN;

-- @case mysql-invalid-alter-actions-without-comma
-- @error
ALTER TABLE orders ADD COLUMN note TEXT RENAME TO archived_orders;

-- @case mysql-invalid-create-like-without-source
-- @error
CREATE TABLE orders LIKE;

-- @case mysql-unsupported-create-table-body
-- @error
CREATE TABLE orders NONSENSE;

-- @case mysql-unsupported-create-table-option
-- @error
CREATE TABLE orders (id INT) GARBAGE;

-- @case mysql-unsupported-create-database-option
-- @error
CREATE DATABASE reporting JUNK;

-- @case mysql-invalid-view-prefix
-- @error
CREATE NONSENSE VIEW order_ids AS SELECT 1;

-- @case mysql-invalid-view-algorithm
-- @error
CREATE ALGORITHM=BOGUS VIEW order_ids AS SELECT 1;

-- @case mysql-unsupported-index-tail-option
-- @error
CREATE INDEX ix_order ON orders (id) GARBAGE;

-- @case mysql-invalid-explain-format
-- @error
EXPLAIN FORMAT=BOGUS SELECT 1;

-- @case mysql-invalid-dumpfile-field-options
-- @error
SELECT 1 INTO DUMPFILE '/tmp/value' FIELDS TERMINATED BY ',';

-- @case mysql-unsupported-outfile-options
-- @error
SELECT 1 INTO OUTFILE '/tmp/value' GARBAGE;

-- @case mysql-invalid-nested-executable-comment
-- @error
SELECT 1 /*!50000 /* hidden */ , (SELECT authentication_string FROM mysql.user) */;

-- @case mysql-invalid-unterminated-block-comment
-- @error
SELECT 1 /* unclosed

-- @case mysql-invalid-unterminated-executable-comment
-- @error
SELECT 1 /*!80000 + 2

-- @case mysql-invalid-unterminated-optimizer-hint
-- @error
SELECT /*+ MAX_EXECUTION_TIME(1000)

-- @case mysql-invalid-lex-reserved-window-alias
-- @error
SELECT a AS window FROM t;

-- @case mysql-invalid-lex-reserved-over-alias
-- @error
SELECT a AS over FROM t;

-- @case mysql-invalid-lex-reserved-key-alias
-- @error
SELECT a AS key FROM t;

-- @case mysql-invalid-lex-reserved-index-alias
-- @error
SELECT a AS index FROM t;

-- @case mysql-invalid-lex-reserved-select-bare-alias
-- @error
SELECT a select FROM t;

-- @case mysql-invalid-lex-reserved-from-bare-alias
-- @error
SELECT a from FROM t;

-- @case mysql-invalid-lex-double-dot-number
-- @error
SELECT 1.2.3;

-- @case mysql-invalid-lex-unterminated-single-quote
-- @error
SELECT 'abc;

-- @case mysql-invalid-lex-unterminated-double-quote
-- @error
SELECT "abc;

-- @case mysql-invalid-lex-unterminated-backtick
-- @error
SELECT `abc FROM t;

-- @case mysql-invalid-lex-trailing-backslash-escapes-quote
-- @error
SELECT 'a\;

-- @case mysql-invalid-lex-bare-double-at
-- @error
SELECT @@ FROM t;

-- @case mysql-invalid-expr-between-missing-and
-- @error
SELECT a BETWEEN 1 FROM t;

-- @case mysql-invalid-expr-in-empty-list
-- @error
SELECT * FROM t WHERE a IN ();

-- @case mysql-invalid-expr-interval-plural-unit
-- @error
SELECT dt + INTERVAL 1 DAYS FROM t;

-- @case mysql-invalid-expr-interval-missing-value
-- @error
SELECT dt - INTERVAL FROM t;

-- @case mysql-invalid-expr-case-empty
-- @error
SELECT CASE END FROM t;

-- @case mysql-invalid-expr-case-when-missing-then
-- @error
SELECT CASE WHEN a END FROM t;

-- @case mysql-invalid-expr-double-equals
-- @error
SELECT a = = b FROM t;

-- @case mysql-invalid-expr-not-equals-keyword
-- @error
SELECT a NOT = b FROM t;

-- @case mysql-invalid-expr-is-literal-number
-- @error
SELECT a IS 1 FROM t;

-- @case mysql-invalid-expr-bare-not
-- @error
SELECT NOT FROM t;

-- @case mysql-invalid-expr-dangling-plus
-- @error
SELECT 1 +;

-- @case mysql-invalid-expr-dangling-plus-before-from
-- @error
SELECT a + FROM t;

-- @case mysql-invalid-expr-dangling-and
-- @error
SELECT a AND FROM t;

-- @case mysql-invalid-expr-bang-not
-- @error
SELECT ! NOT a FROM t;

-- @case mysql-invalid-expr-equals-not-operand
-- @error
SELECT a = NOT b FROM t;

-- @case mysql-invalid-expr-split-not-equal-operator
-- @error
SELECT a < > b FROM t;

-- @case mysql-invalid-expr-not-sounds-like
-- @error
SELECT a NOT SOUNDS LIKE 'x' FROM t;

-- @case mysql-invalid-func-cast-as-missing-type
-- @error
SELECT CAST(a AS) FROM t;

-- @case mysql-invalid-func-extract-unknown-unit
-- @error
SELECT EXTRACT(CENTURY FROM dt) FROM t;

-- @case mysql-invalid-func-trim-both-without-from
-- @error
SELECT TRIM(BOTH s) FROM t;

-- @case mysql-invalid-func-substring-for-without-from
-- @error
SELECT SUBSTRING(s FOR 3) FROM t;

-- @case mysql-invalid-func-match-boolean-with-expansion
-- @error
SELECT MATCH(title) AGAINST ('x' IN BOOLEAN MODE WITH QUERY EXPANSION) FROM articles;

-- @case mysql-invalid-func-group-concat-separator-missing
-- @error
SELECT GROUP_CONCAT(a SEPARATOR) FROM t;

-- @case mysql-invalid-func-rank-over-missing-window
-- @error
SELECT RANK() OVER FROM t;

-- @case mysql-invalid-func-three-part-function-name
-- @error
SELECT a.b.f(1) FROM t;

-- @case mysql-invalid-func-aggregate-filter-clause
-- @error
SELECT SUM(a) FILTER (WHERE a > 1) FROM t;

-- @case mysql-invalid-func-count-distinct-empty
-- @error
SELECT COUNT(DISTINCT) FROM t;

-- @case mysql-invalid-func-trim-remstr-without-from
-- @error
SELECT TRIM(BOTH 'x' s) FROM t;

-- @case mysql-invalid-func-extract-without-from
-- @error
SELECT EXTRACT(YEAR dt) FROM t;

-- @case mysql-invalid-func-convert-using-missing-charset
-- @error
SELECT CONVERT(s USING) FROM t;

-- @case mysql-invalid-func-position-in-missing-rhs
-- @error
SELECT POSITION('a' IN) FROM t;

-- @case mysql-invalid-func-group-concat-separator-before-order
-- @error
SELECT GROUP_CONCAT(a SEPARATOR ',' ORDER BY a) FROM t;

-- @case mysql-invalid-func-substring-from-missing-arg
-- @error
SELECT SUBSTRING(s FROM) FROM t;

-- @case mysql-invalid-func-double-over
-- @error
SELECT LAG(a) OVER () OVER () FROM t;

-- @case mysql-invalid-select-distinct-with-all
-- @error
SELECT DISTINCT ALL id FROM orders;

-- @case mysql-invalid-select-group-by-desc
-- @error
SELECT customer_id FROM orders GROUP BY customer_id DESC;

-- @case mysql-invalid-select-limit-negative
-- @error
SELECT id FROM orders LIMIT -1;

-- @case mysql-invalid-select-limit-parenthesized
-- @error
SELECT id FROM orders LIMIT (1);

-- @case mysql-invalid-select-limit-offset-and-comma
-- @error
SELECT id FROM orders LIMIT 1 OFFSET 2, 3;

-- @case mysql-invalid-select-where-after-order-by
-- @error
SELECT id FROM orders ORDER BY id WHERE id > 1;

-- @case mysql-invalid-select-having-before-group-by
-- @error
SELECT customer_id FROM orders HAVING customer_id > 1 GROUP BY customer_id;

-- @case mysql-invalid-select-order-by-after-limit
-- @error
SELECT id FROM orders LIMIT 1 ORDER BY id;

-- @case mysql-invalid-select-window-after-order-by
-- @error
SELECT SUM(total) OVER w FROM orders ORDER BY id WINDOW w AS ();

-- @case mysql-invalid-select-rows-start-following
-- @error
SELECT SUM(total) OVER (ORDER BY id ROWS 1 FOLLOWING) FROM orders;

-- @case mysql-invalid-select-rows-between-missing-and
-- @error
SELECT SUM(total) OVER (ORDER BY id ROWS BETWEEN 1 FOLLOWING) FROM orders;

-- @case mysql-invalid-select-rows-start-unbounded-following
-- @error
SELECT SUM(total) OVER (ORDER BY id ROWS UNBOUNDED FOLLOWING) FROM orders;

-- @case mysql-invalid-select-join-using-empty
-- @error
SELECT * FROM t1 JOIN t2 USING ();

-- @case mysql-invalid-select-reserved-table-alias
-- @error
SELECT * FROM t1 AS select;

-- @case mysql-invalid-select-partition-after-alias
-- @error
SELECT * FROM orders AS o PARTITION (p0);

-- @case mysql-invalid-select-force-index-empty
-- @error
SELECT * FROM orders FORCE INDEX ();

-- @case mysql-invalid-select-lock-in-share-mode-nowait
-- @error
SELECT * FROM orders LOCK IN SHARE MODE NOWAIT;

-- @case mysql-invalid-select-nowait-and-skip-locked
-- @error
SELECT * FROM orders FOR UPDATE NOWAIT SKIP LOCKED;

-- @case mysql-invalid-select-for-update-of-empty
-- @error
SELECT * FROM orders FOR UPDATE OF;

-- @case mysql-invalid-select-locking-before-limit
-- @error
SELECT * FROM orders FOR UPDATE LIMIT 1;

-- @case mysql-invalid-query-subquery-as-limit
-- @error
SELECT * FROM t1 LIMIT (SELECT 1);

-- @case mysql-invalid-query-with-without-query
-- @error
WITH c AS (SELECT 1);

-- @case mysql-invalid-query-cte-missing-as
-- @error
WITH c (SELECT 1) SELECT * FROM c;

-- @case mysql-invalid-query-cte-trailing-comma
-- @error
WITH c AS (SELECT 1), SELECT * FROM c;

-- @case mysql-invalid-query-recursive-without-cte
-- @error
WITH RECURSIVE SELECT 1;

-- @case mysql-invalid-query-operand-order-by-without-parens
-- @error
SELECT 1 ORDER BY 1 UNION SELECT 2;

-- @case mysql-invalid-query-operand-limit-without-parens
-- @error
SELECT 1 LIMIT 1 UNION SELECT 2;

-- @case mysql-invalid-query-union-all-distinct
-- @error
SELECT 1 UNION ALL DISTINCT SELECT 2;

-- @case mysql-invalid-query-union-empty-parens
-- @error
SELECT 1 UNION ();

-- @case mysql-invalid-query-union-without-right-operand
-- @error
SELECT 1 UNION;

-- @case mysql-invalid-query-exists-empty-parens
-- @error
SELECT * FROM t1 WHERE EXISTS ();

-- @case mysql-invalid-select-list-trailing-comma
-- @error
SELECT a, FROM t;

-- @case mysql-invalid-select-list-leading-comma
-- @error
SELECT ,a FROM t;

-- @case mysql-invalid-select-list-double-comma
-- @error
SELECT a,,b FROM t;

-- @case mysql-invalid-from-list-trailing-comma
-- @error
SELECT * FROM t1, FROM;

-- @case mysql-invalid-from-list-double-comma
-- @error
SELECT * FROM t1,,t2;

-- @case mysql-invalid-group-by-trailing-comma
-- @error
SELECT a FROM t GROUP BY a,;

-- @case mysql-invalid-order-by-trailing-comma
-- @error
SELECT a FROM t ORDER BY a,;

-- @case mysql-invalid-in-list-trailing-comma
-- @error
SELECT * FROM t WHERE a IN (1,2,);

-- @case mysql-invalid-function-args-trailing-comma
-- @error
SELECT CONCAT(a,) FROM t;

-- @case mysql-invalid-function-args-leading-comma
-- @error
SELECT CONCAT(,a) FROM t;

-- @case mysql-invalid-operand-missing-after-plus
-- @error
SELECT 1 +;

-- @case mysql-invalid-operand-missing-after-equals
-- @error
SELECT * FROM t WHERE a =;

-- @case mysql-invalid-operand-missing-before-and
-- @error
SELECT * FROM t WHERE a > AND b = 1;

-- @case mysql-invalid-paren-unclosed
-- @error
SELECT (1 + 2;

-- @case mysql-invalid-paren-extra-close
-- @error
SELECT (1 + 2));

-- @case mysql-invalid-paren-empty-select
-- @error
SELECT ();

-- @case mysql-invalid-paren-empty-from
-- @error
SELECT * FROM ();

-- @case mysql-invalid-paren-empty-where
-- @error
SELECT * FROM t WHERE ();

-- @case mysql-invalid-order-where-after-group-by
-- @error
SELECT a FROM t GROUP BY a WHERE a > 1;

-- @case mysql-invalid-order-having-before-group-by
-- @error
SELECT a FROM t HAVING a > 1 GROUP BY a;

-- @case mysql-invalid-order-where-after-order-by
-- @error
SELECT a FROM t ORDER BY a WHERE a > 1;

-- @case mysql-invalid-order-order-by-after-limit
-- @error
SELECT a FROM t LIMIT 1 ORDER BY a;

-- @case mysql-invalid-order-window-after-order-by
-- @error
SELECT a, ROW_NUMBER() OVER w FROM t ORDER BY a WINDOW w AS ();

-- @case mysql-invalid-order-from-after-where
-- @error
SELECT a WHERE a > 1 FROM t;

-- @case mysql-invalid-duplicate-where
-- @error
SELECT a FROM t WHERE a > 1 WHERE b > 1;

-- @case mysql-invalid-duplicate-order-by
-- @error
SELECT a FROM t ORDER BY a ORDER BY b;

-- @case mysql-invalid-duplicate-limit
-- @error
SELECT a FROM t LIMIT 1 LIMIT 2;

-- @case mysql-invalid-duplicate-from
-- @error
SELECT a FROM t FROM t1;

-- @case mysql-invalid-bare-select-keyword
-- @error
SELECT;

-- @case mysql-invalid-bare-from-keyword
-- @error
SELECT * FROM;

-- @case mysql-invalid-bare-order-by
-- @error
SELECT 1 FROM t ORDER BY;

-- @case mysql-invalid-bare-group-by
-- @error
SELECT 1 FROM t GROUP BY;

-- @case mysql-invalid-bare-limit
-- @error
SELECT 1 FROM t LIMIT;

-- @case mysql-invalid-bare-join
-- @error
SELECT 1 FROM t JOIN;

-- @case mysql-invalid-bare-join-on
-- @error
SELECT 1 FROM t1 JOIN t2 ON;

-- @case mysql-invalid-empty-using
-- @error
SELECT 1 FROM t1 JOIN t2 USING ();

-- @case mysql-invalid-reserved-select-as-column
-- @error
SELECT select;

-- @case mysql-invalid-reserved-order-as-table
-- @error
SELECT * FROM order;

-- @case mysql-invalid-reserved-from-as-alias
-- @error
SELECT a AS from FROM t;

-- @case mysql-invalid-as-as
-- @error
SELECT a AS AS FROM t;

-- @case mysql-invalid-table-as-without-alias
-- @error
SELECT a FROM t AS;

-- @case mysql-invalid-dangling-and
-- @error
SELECT * FROM t WHERE a = 1 AND;

-- @case mysql-invalid-leading-or
-- @error
SELECT * FROM t WHERE OR a = 1;

-- @case mysql-invalid-dangling-not
-- @error
SELECT * FROM t WHERE NOT;

-- @case mysql-invalid-is-without-operand
-- @error
SELECT * FROM t WHERE a IS;

-- @case mysql-invalid-between-without-and
-- @error
SELECT * FROM t WHERE a BETWEEN 1;

-- @case mysql-invalid-between-with-or
-- @error
SELECT * FROM t WHERE a BETWEEN 1 OR 2;

-- @case mysql-invalid-case-without-end
-- @error
SELECT CASE WHEN a THEN 1;

-- @case mysql-invalid-case-without-when
-- @error
SELECT CASE END;

-- @case mysql-invalid-case-else-only
-- @error
SELECT CASE a ELSE 1 END;

-- @case mysql-invalid-in-without-parens
-- @error
SELECT * FROM t WHERE a IN 1;

-- @case mysql-invalid-like-without-pattern
-- @error
SELECT * FROM t WHERE a LIKE;

-- @case mysql-invalid-exists-without-subquery
-- @error
SELECT EXISTS;

-- @case mysql-invalid-exists-with-expression
-- @error
SELECT EXISTS (1);

-- @case mysql-invalid-unterminated-string
-- @error
SELECT 'abc;

-- @case mysql-invalid-adjacent-literals
-- @error
SELECT 1 1;

-- @case mysql-invalid-three-adjacent-identifiers
-- @error
SELECT a b c FROM t;

-- @case mysql-invalid-double-star
-- @error
SELECT * * FROM t;

-- @case mysql-invalid-leading-dot-column
-- @error
SELECT .a FROM t;

-- @case mysql-invalid-double-dot-column
-- @error
SELECT a..b FROM t;

-- @case mysql-invalid-bare-system-variable-prefix
-- @error
SELECT @@;

-- @case mysql-invalid-placeholder-qualifier
-- @error
SELECT ?.a;

-- @case mysql-invalid-placeholder-call
-- @error
SELECT 1 FROM t WHERE a = ?(1);

-- @case mysql-invalid-on-without-join
-- @error
SELECT * FROM t1 ON t1.a = 1;

-- @case mysql-invalid-using-qualified-column
-- @error
SELECT * FROM t1 JOIN t2 USING (t1.a);

-- @case mysql-invalid-limit-expression
-- @error
SELECT * FROM t LIMIT 1 + 1;

-- @case mysql-invalid-limit-parenthesized
-- @error
SELECT * FROM t LIMIT (1);

-- @case mysql-invalid-over-without-window
-- @error
SELECT COUNT(*) OVER FROM t;

-- @case mysql-invalid-group-by-with-cube
-- @error
SELECT a FROM t GROUP BY a WITH CUBE;

-- @case mysql-invalid-nulls-first
-- @error
SELECT a FROM t ORDER BY 1 NULLS FIRST;

-- @case mysql-invalid-limit-all
-- @error
SELECT a FROM t LIMIT ALL;

-- @case mysql-invalid-fetch-first
-- @error
SELECT a FROM t FETCH FIRST 1 ROWS ONLY;

-- @case mysql-invalid-offset-without-limit
-- @error
SELECT a FROM t OFFSET 1;

-- @case mysql-invalid-top-n
-- @error
SELECT TOP 10 a FROM t;

-- @case mysql-invalid-ilike
-- @error
SELECT * FROM t WHERE a ILIKE 'x';

-- @case mysql-invalid-double-colon-cast
-- @error
SELECT a::int FROM t;

-- @case mysql-invalid-bracket-identifier
-- @error
SELECT [a] FROM t;

-- @case mysql-invalid-distinct-on
-- @error
SELECT DISTINCT ON (a) a FROM t;

-- @case mysql-invalid-minus-set-operator
-- @error
SELECT a FROM t MINUS SELECT a FROM t1;

-- @case mysql-invalid-table-hint-nolock
-- @error
SELECT a FROM t WITH (NOLOCK);

-- @case mysql-invalid-full-outer-join
-- @error
SELECT a FROM t1 FULL OUTER JOIN t2 ON t1.a = t2.a;

-- @case mysql-invalid-returning
-- @error
SELECT a FROM t1 RETURNING a;

-- @case mysql-invalid-join-on-and-using
-- @error
SELECT 1 FROM t1 JOIN t2 ON t1.a = t2.a USING (a);

-- @case mysql-invalid-asc-desc
-- @error
SELECT a FROM t ORDER BY a ASC DESC;

-- @case mysql-invalid-all-distinct
-- @error
SELECT ALL DISTINCT a FROM t;

-- @case mysql-invalid-limit-three-values
-- @error
SELECT a FROM t LIMIT 1, 2, 3;

-- @case mysql-invalid-limit-offset-comma
-- @error
SELECT a FROM t LIMIT 1 OFFSET 2, 3;

-- @case mysql-invalid-limit-negative
-- @error
SELECT a FROM t LIMIT -1;

-- @case mysql-invalid-cast-without-type
-- @error
SELECT CAST(a AS) FROM t;

-- @case mysql-invalid-cast-without-as
-- @error
SELECT CAST(a INT) FROM t;

-- @case mysql-invalid-table-double-alias
-- @error
SELECT a FROM t AS x AS y;

-- @case mysql-invalid-union-without-rhs
-- @error
SELECT a FROM t1 UNION;

-- @case mysql-invalid-union-all-distinct
-- @error
SELECT a FROM t1 UNION ALL DISTINCT SELECT 1;

-- @case mysql-invalid-bare-not
-- @error
SELECT NOT;

-- @case mysql-invalid-bare-minus
-- @error
SELECT -;

-- @case mysql-invalid-join-double-on
-- @error
SELECT 1 FROM t1 JOIN t2 ON t1.a = t2.a ON t1.b = t2.b;

-- @case mysql-invalid-reserved-column
-- @error
SELECT rank FROM t;

-- @case mysql-invalid-reserved-alias
-- @error
SELECT a AS row_number FROM t;

-- @case mysql-invalid-reserved-bare-alias
-- @error
SELECT a lead FROM t;

-- @case mysql-invalid-reserved-table-alias
-- @error
SELECT * FROM t rank;

-- @case mysql-invalid-reserved-table-name
-- @error
SELECT * FROM table;

-- @case mysql-invalid-reserved-after-dot-and-space
-- @error
SELECT t. select FROM t;

-- @case mysql-invalid-reserved-qualified-table-after-space
-- @error
SELECT * FROM shop. select;

-- @case mysql-invalid-reserved-function-name
-- @error
SELECT read(1);

-- @case mysql-invalid-if-arity
-- @error
SELECT IF(a, 1) FROM t;

-- @case mysql-invalid-insert-function-arity
-- @error
SELECT INSERT('abc', 1, 1);

-- @case mysql-invalid-values-function-literal
-- @error
SELECT VALUES(1);

-- @case mysql-invalid-default-function-literal
-- @error
SELECT DEFAULT(1);

-- @case mysql-invalid-precision-not-integer
-- @error
SELECT CURRENT_TIMESTAMP('a');

-- @case mysql-invalid-precision-placeholder
-- @error
SELECT CURRENT_TIME(?);

-- @case mysql-invalid-ranking-without-over
-- @error
SELECT ROW_NUMBER() FROM t;

-- @case mysql-invalid-ranking-with-argument
-- @error
SELECT RANK(a) OVER () FROM t;

-- @case mysql-invalid-lag-too-many-arguments
-- @error
SELECT LAG(a, 1, 0, 1) OVER () FROM t;

-- @case mysql-invalid-lag-negative-offset
-- @error
SELECT LAG(a, -1) OVER () FROM t;

-- @case mysql-invalid-ntile-expression
-- @error
SELECT NTILE(2 + 1) OVER () FROM t;

-- @case mysql-invalid-over-on-scalar-function
-- @error
SELECT CONCAT(a) OVER () FROM t;

-- @case mysql-invalid-over-on-keyword-function
-- @error
SELECT LEFT(a, 1) OVER () FROM t;

-- @case mysql-invalid-over-on-stored-function
-- @error
SELECT shop.f(a) OVER () FROM t;

-- @case mysql-invalid-count-two-arguments
-- @error
SELECT COUNT(a, b) FROM t;

-- @case mysql-invalid-count-empty
-- @error
SELECT COUNT() FROM t;

-- @case mysql-invalid-count-distinct-star
-- @error
SELECT COUNT(DISTINCT *) FROM t;

-- @case mysql-invalid-sum-star
-- @error
SELECT SUM(*) FROM t;

-- @case mysql-invalid-sum-two-arguments
-- @error
SELECT SUM(a, b) FROM t;

-- @case mysql-invalid-avg-distinct-two-arguments
-- @error
SELECT AVG(DISTINCT a, b) FROM t;

-- @case mysql-invalid-std-distinct
-- @error
SELECT STD(DISTINCT a) FROM t;

-- @case mysql-invalid-json-objectagg-one-argument
-- @error
SELECT JSON_OBJECTAGG(a) FROM t;

-- @case mysql-invalid-max-order-by
-- @error
SELECT MAX(a ORDER BY b) FROM t;

-- @case mysql-invalid-standalone-interval
-- @error
SELECT INTERVAL 1 DAY;

-- @case mysql-invalid-interval-minus-value
-- @error
SELECT INTERVAL 1 DAY - dt FROM t;

-- @case mysql-invalid-parenthesized-interval
-- @error
SELECT (INTERVAL 1 DAY) + dt FROM t;

-- @case mysql-invalid-interval-multiply
-- @error
SELECT dt * INTERVAL 1 DAY FROM t;

-- @case mysql-invalid-interval-argument
-- @error
SELECT CONCAT(INTERVAL 1 DAY) FROM t;

-- @case mysql-invalid-date-add-number
-- @error
SELECT DATE_ADD(dt, 5) FROM t;

-- @case mysql-invalid-cast-int
-- @error
SELECT CAST(a AS INT) FROM t;

-- @case mysql-invalid-cast-varchar
-- @error
SELECT CAST(a AS VARCHAR(10)) FROM t;

-- @case mysql-invalid-cast-timestamp
-- @error
SELECT CAST(a AS TIMESTAMP) FROM t;

-- @case mysql-invalid-cast-signed-unsigned
-- @error
SELECT CAST(a AS SIGNED UNSIGNED) FROM t;

-- @case mysql-invalid-cast-decimal-three-numbers
-- @error
SELECT CAST(a AS DECIMAL(10, 2, 1)) FROM t;

-- @case mysql-invalid-cast-char-collate
-- @error
SELECT CAST(a AS CHAR(10) COLLATE utf8mb4_bin) FROM t;

-- @case mysql-invalid-cast-expression-only
-- @error
SELECT CAST(a) FROM t;

-- @case mysql-invalid-convert-without-type
-- @error
SELECT CONVERT(a) FROM t;

-- @case mysql-invalid-extract-without-from
-- @error
SELECT EXTRACT(dt) FROM t;

-- @case mysql-invalid-trim-from-only
-- @error
SELECT TRIM(FROM s) FROM t;

-- @case mysql-invalid-position-without-in
-- @error
SELECT POSITION(s) FROM t;

-- @case mysql-invalid-like-chain
-- @error
SELECT a LIKE b LIKE c FROM t;

-- @case mysql-invalid-in-chain
-- @error
SELECT a IN (1) IN (1) FROM t;

-- @case mysql-invalid-is-null-then-like
-- @error
SELECT a IS NULL LIKE b FROM t;

-- @case mysql-invalid-regexp-then-like
-- @error
SELECT a REGEXP b LIKE c FROM t;

-- @case mysql-invalid-member-of-then-like
-- @error
SELECT a MEMBER OF (j) LIKE b FROM t;

-- @case mysql-invalid-is-true-compared
-- @error
SELECT a IS TRUE = 1 FROM t;

-- @case mysql-invalid-is-true-twice
-- @error
SELECT a IS TRUE IS TRUE FROM t;

-- @case mysql-invalid-like-pattern-arithmetic
-- @error
SELECT a LIKE b + 1 FROM t;

-- @case mysql-invalid-like-escape-arithmetic
-- @error
SELECT a LIKE 'x' ESCAPE '!' + 1 FROM t;

-- @case mysql-invalid-any-value-list
-- @error
SELECT a = ANY (1) FROM t;

-- @case mysql-invalid-json-arrow-parenthesized
-- @error
SELECT (j)->'$' FROM t;

-- @case mysql-invalid-json-arrow-chain
-- @error
SELECT j->'$'->'$' FROM t;

-- @case mysql-invalid-json-arrow-function-result
-- @error
SELECT JSON_EXTRACT(j, '$')->'$' FROM t;

-- @case mysql-invalid-star-after-column
-- @error
SELECT id, * FROM orders;

-- @case mysql-invalid-star-twice
-- @error
SELECT *, * FROM orders;

-- @case mysql-invalid-dual-in-table-list
-- @error
SELECT * FROM orders, dual;

-- @case mysql-invalid-dual-alias
-- @error
SELECT 1 FROM DUAL d;

-- @case mysql-invalid-dual-join
-- @error
SELECT 1 FROM DUAL JOIN t;

-- @case mysql-invalid-dual-parenthesized
-- @error
SELECT 1 FROM (DUAL);

-- @case mysql-invalid-left-join-without-condition
-- @error
SELECT * FROM t1 LEFT JOIN t2;

-- @case mysql-invalid-right-outer-join-without-condition
-- @error
SELECT * FROM t1 RIGHT OUTER JOIN t2;

-- @case mysql-invalid-natural-join-using
-- @error
SELECT * FROM t1 NATURAL JOIN t2 USING (id);

-- @case mysql-invalid-natural-left-join-on
-- @error
SELECT * FROM t1 NATURAL LEFT JOIN t2 ON t1.id = t2.id;

-- @case mysql-invalid-limit-decimal
-- @error
SELECT id FROM orders LIMIT 1.5;

-- @case mysql-invalid-limit-exponent
-- @error
SELECT 1 LIMIT 1e1;

-- @case mysql-invalid-limit-user-variable
-- @error
SELECT id FROM orders LIMIT @v;

-- @case mysql-invalid-offset-decimal
-- @error
SELECT 1 LIMIT 1 OFFSET 1.0;

-- @case mysql-invalid-derived-table-without-alias
-- @error
SELECT * FROM (SELECT 1);

-- @case mysql-invalid-lateral-without-alias
-- @error
SELECT * FROM LATERAL (SELECT 1);

-- @case mysql-invalid-use-and-force-index
-- @error
SELECT * FROM orders USE INDEX () FORCE INDEX (PRIMARY);

-- @case mysql-invalid-use-and-force-index-different-scope
-- @error
SELECT * FROM t USE INDEX FOR JOIN (PRIMARY) FORCE INDEX FOR ORDER BY (PRIMARY);

-- @case mysql-invalid-hex-odd-digits
-- @error
SELECT X'0';

-- @case mysql-invalid-hex-digits
-- @error
SELECT X'GG';

-- @case mysql-invalid-bit-digits
-- @error
SELECT b'102';

-- @case mysql-invalid-space-before-paren-count-star
-- @error
SELECT COUNT (*) FROM t;

-- @case mysql-invalid-space-before-paren-distinct
-- @error
SELECT SUM (DISTINCT a) FROM t;

-- @case mysql-invalid-space-before-paren-over
-- @error
SELECT MAX (a) OVER () FROM t;

-- @case mysql-invalid-space-before-paren-separator
-- @error
SELECT GROUP_CONCAT (a SEPARATOR ',') FROM t;

-- @case mysql-invalid-space-before-paren-cast
-- @error
SELECT CAST (a AS CHAR) FROM t;

-- @case mysql-invalid-space-before-paren-extract
-- @error
SELECT EXTRACT (DAY FROM dt) FROM t;

-- @case mysql-invalid-space-before-paren-trim-from
-- @error
SELECT TRIM (LEADING 'x' FROM s) FROM t;

-- @case mysql-invalid-space-before-paren-substring-from
-- @error
SELECT SUBSTRING (s FROM 2) FROM t;

-- @case mysql-invalid-space-before-paren-date-add-interval
-- @error
SELECT DATE_ADD (dt, INTERVAL 1 DAY) FROM t;

-- @case mysql-invalid-quoted-function-distinct
-- @error
SELECT `count`(DISTINCT a) FROM t;

-- @case mysql-invalid-quoted-function-over
-- @error
SELECT `sum`(a) OVER () FROM t;

-- @case mysql-invalid-quoted-function-star
-- @error
SELECT `count`(*) FROM t;

-- @case mysql-invalid-count-qualified-star
-- @error
SELECT COUNT(t.*) FROM t;

-- @case mysql-invalid-limit-above-unsigned-64-bit
-- @error
SELECT 1 LIMIT 18446744073709551616;

-- @case mysql-invalid-ntile-decimal
-- @error
SELECT NTILE(1.0) OVER () FROM t;

-- @case mysql-invalid-precision-decimal
-- @error
SELECT CURRENT_TIME(3.0);

-- @case mysql-invalid-lag-decimal-offset
-- @error
SELECT LAG(a, 1.0) OVER () FROM t;

-- @case mysql-invalid-precision-user-variable
-- @error
SELECT CURRENT_TIME(@n);

-- @case mysql-invalid-ntile-parenthesized-integer
-- @error
SELECT NTILE((1)) OVER () FROM t;

-- @case mysql-invalid-ntile-system-variable
-- @error
SELECT NTILE(@@autocommit) OVER () FROM t;

-- @case mysql-invalid-ntile-above-unsigned-64-bit
-- @error
SELECT NTILE(18446744073709551616) OVER () FROM t;

-- @case mysql-invalid-quoted-function-all
-- @error
SELECT `count`(ALL 1);

-- @case mysql-invalid-scalar-function-all
-- @error
SELECT CONCAT(ALL a) FROM t;

-- @case mysql-invalid-ntile-parenthesized-placeholder
-- @error
SELECT NTILE((?)) OVER () FROM t;

-- @case mysql-invalid-lag-parenthesized-user-variable
-- @error
SELECT LAG(a, (@n)) OVER () FROM t;
