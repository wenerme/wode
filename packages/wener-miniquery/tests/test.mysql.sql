-- @case mysql-select-constant
-- @expect {"types":["Select"],"tables":[],"risks":[],"functions":[],"comments":[]}
SELECT 1;

-- @case mysql-projection-filter-order-and-comma-limit
-- @expect {"types":["Select"],"tables":[{"db":"shop","name":"orders","access":"read"}],"risks":[]}
SELECT id, total AS amount, o.*
FROM shop.orders AS o
WHERE total > 100 AND status IN ('paid', 'shipped') OR note LIKE 'priority%'
ORDER BY id DESC
LIMIT 10, 20;

-- @case mysql-select-modifiers-and-offset-limit
-- @expect {"types":["Select"],"tables":[{"name":"orders","access":"read"}],"risks":[]}
SELECT DISTINCT SQL_NO_CACHE customer_id
FROM orders
LIMIT 10 OFFSET 5;

-- @case mysql-aggregates-rollup-and-having
-- @expect {"types":["Select"],"tables":[{"name":"orders","access":"read"}],"functions":["COUNT","GROUP_CONCAT"],"risks":[]}
SELECT customer_id, COUNT(*), COUNT(DISTINCT status),
       GROUP_CONCAT(note ORDER BY note DESC SEPARATOR ',') AS notes
FROM orders
GROUP BY customer_id WITH ROLLUP
HAVING COUNT(*) > 1;

-- @case mysql-joins-using-natural-cross-and-correlated-exists
-- @expect {"types":["Select"],"tables":[{"name":"orders","access":"read"},{"name":"payments","access":"read"},{"name":"customers","access":"read"},{"name":"regions","access":"read"},{"name":"currencies","access":"read"}],"risks":[]}
SELECT *
FROM orders o
LEFT JOIN payments p ON o.id = p.order_id
JOIN customers USING (customer_id)
NATURAL JOIN regions
CROSS JOIN currencies
WHERE EXISTS (SELECT 1 FROM payments pending WHERE pending.order_id = o.id);

-- @case mysql-derived-tables-parenthesized-joins-and-lateral
-- @expect {"types":["Select","Select"],"tables":[{"name":"orders","access":"read"},{"name":"customers","access":"read"},{"name":"regions","access":"read"},{"name":"orders","access":"read"},{"name":"payments","access":"read"}],"functions":["MAX"],"risks":[]}
SELECT *
FROM orders, (SELECT 1 AS flag) AS constants,
     (customers c INNER JOIN regions r ON c.region_id = r.id);
SELECT o.id, latest.amount
FROM orders o,
     LATERAL (SELECT MAX(amount) AS amount FROM payments WHERE order_id = o.id) AS latest;

-- @case mysql-right-and-straight-joins
-- @expect {"types":["Select"],"tables":[{"name":"orders","access":"read"},{"name":"customers","access":"read"},{"name":"regions","access":"read"}],"risks":[]}
SELECT *
FROM orders o RIGHT OUTER JOIN customers c ON o.customer_id = c.id
STRAIGHT_JOIN regions r ON c.region_id = r.id;

-- @case mysql-partitions-and-index-hints
-- @expect {"types":["Select"],"tables":[{"name":"orders","access":"read"}],"risks":[]}
SELECT * FROM orders PARTITION (p0, p1)
USE INDEX (idx_customer) IGNORE INDEX FOR JOIN (idx_status)
IGNORE INDEX FOR ORDER BY (idx_created);

-- @case mysql-recursive-cte
-- @expect {"types":["Select"],"tables":[],"functions":[],"risks":[]}
WITH RECURSIVE sequence (n) AS (
  SELECT 1
  UNION ALL
  SELECT n + 1 FROM sequence WHERE n < 10
)
SELECT * FROM sequence;

-- @case mysql-cte-scope-and-qualified-physical-table
-- @expect {"types":["Select"],"tables":[{"name":"orders","access":"read"},{"db":"shop","name":"orders","access":"read"}],"risks":[]}
SELECT *
FROM (WITH orders AS (SELECT 1 AS id) SELECT * FROM orders) local_orders,
     orders, shop.orders;

-- @case mysql-set-operations-and-parenthesized-query-tails
-- @expect {"types":["SetOp","SetOp","SetOp"],"tables":[{"name":"current_orders","access":"read"},{"name":"archived_orders","access":"read"},{"name":"pending_orders","access":"read"},{"name":"current_orders","access":"read"},{"name":"cancelled_orders","access":"read"},{"name":"paid_orders","access":"read"},{"name":"current_orders","access":"read"},{"name":"archived_orders","access":"read"}],"risks":[]}
SELECT id FROM current_orders
UNION SELECT id FROM archived_orders
UNION ALL (SELECT id FROM pending_orders ORDER BY id LIMIT 1)
ORDER BY id LIMIT 5;
(SELECT id FROM current_orders EXCEPT SELECT id FROM cancelled_orders)
INTERSECT SELECT id FROM paid_orders;
(SELECT id FROM current_orders) UNION DISTINCT (SELECT id FROM archived_orders);

-- @case mysql-insert-values-default-and-duplicate-update
-- @expect {"types":["Insert"],"tables":[{"name":"inventory","access":"write"}],"functions":["VALUES"],"risks":[]}
INSERT INTO inventory (sku, quantity)
VALUES ('book', 2), ('pen', DEFAULT)
ON DUPLICATE KEY UPDATE quantity = VALUES(quantity);

-- @case mysql-insert-set-ignore-and-replace-priority
-- @expect {"types":["Insert","Insert"],"tables":[{"db":"shop","name":"orders","access":"write"},{"name":"inventory","access":"write"}],"functions":["NOW"],"risks":[]}
INSERT IGNORE INTO shop.orders SET id = 1, created_at = NOW();
REPLACE LOW_PRIORITY INTO inventory VALUES ('book', 3);

-- @case mysql-insert-select-and-cte-dependencies
-- @expect {"types":["Insert","Insert"],"tables":[{"name":"archived_orders","access":"write"},{"name":"orders","access":"read"},{"db":"reporting","name":"paid_orders","access":"write"},{"name":"orders","access":"read"},{"name":"customers","access":"read"}],"risks":[]}
INSERT INTO archived_orders (id) SELECT id FROM orders WHERE total > 0;
INSERT INTO reporting.paid_orders
WITH paid AS (SELECT * FROM orders WHERE status = 'paid')
SELECT paid.* FROM paid JOIN customers c ON c.id = paid.customer_id;

-- @case mysql-update-parameter-order-limit
-- @expect {"types":["Update"],"tables":[{"name":"inventory","access":"write"}],"functions":[],"risks":[]}
UPDATE LOW_PRIORITY IGNORE inventory
SET quantity = quantity + 1
WHERE id = ?
ORDER BY id LIMIT 1;

-- @case mysql-update-join-resolves-written-alias
-- @expect {"types":["Update"],"tables":[{"name":"inventory","access":"write"},{"name":"deliveries","access":"read"}],"risks":[]}
UPDATE inventory i JOIN deliveries d ON i.sku = d.sku
SET i.quantity = d.quantity, i.note = NULL
WHERE d.quantity IS NOT NULL;

-- @case mysql-multi-target-delete-forms
-- @expect {"types":["Delete","Delete"],"tables":[{"name":"orders","access":"write"},{"name":"payments","access":"write"},{"name":"orders","access":"write"},{"name":"payments","access":"write"}],"risks":[]}
DELETE o, p FROM orders o JOIN payments p ON o.id = p.order_id
WHERE p.amount IS NULL;
DELETE FROM orders, payments USING orders JOIN payments ON orders.id = payments.order_id
WHERE orders.status = 'cancelled';

-- @case mysql-delete-priority-order-limit
-- @expect {"types":["Delete"],"tables":[{"name":"orders","access":"write"}],"risks":[]}
DELETE LOW_PRIORITY QUICK IGNORE FROM orders
WHERE id = 1 ORDER BY id LIMIT 10;

-- @case mysql-unbounded-writes-and-dangerous-delete-predicate
-- @expect {"types":["Update","Delete","Delete"],"tables":[{"name":"inventory","access":"write"},{"name":"deliveries","access":"read"},{"name":"expired_sessions","access":"write"},{"name":"orders","access":"write"},{"name":"payments","access":"read"}],"functions":["SLEEP"],"risks":["no-where","no-where","dangerous-function"]}
UPDATE inventory i JOIN deliveries d ON i.sku = d.sku SET i.quantity = d.quantity;
DELETE FROM expired_sessions;
DELETE o FROM orders o JOIN payments p ON o.id = p.order_id WHERE SLEEP(1);

-- @case mysql-case-cast-and-convert
-- @expect {"types":["Select"],"tables":[{"name":"orders","access":"read"}],"risks":[]}
SELECT CASE WHEN total > 0 THEN 1 ELSE 0 END,
       CASE status WHEN 'paid' THEN 1 END,
       CAST(total AS DECIMAL(10, 2)), CONVERT(id, CHAR(10)),
       CONVERT(note USING utf8mb4)
FROM orders;

-- @case mysql-temporal-and-special-string-functions
-- @expect {"types":["Select"],"tables":[{"name":"orders","access":"read"}],"functions":["NOW","DATE_ADD","EXTRACT","TRIM","POSITION","SUBSTRING","CURRENT_TIMESTAMP","UTC_DATE"],"risks":[]}
SELECT INTERVAL 1 DAY + NOW(), DATE_ADD(NOW(), INTERVAL -1 HOUR),
       EXTRACT(YEAR FROM created_at), TRIM(LEADING 'x' FROM note), TRIM(note),
       POSITION('a' IN note), SUBSTRING(note FROM 2 FOR 3),
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP(3), UTC_DATE()
FROM orders;

-- @case mysql-json-operators-and-session-variables
-- @expect {"types":["Select"],"tables":[{"name":"events","access":"read"}],"risks":[]}
SELECT payload->>'$.name', payload->'$.items', @counter := 1,
       @@session.sql_mode, @@max_connections, @`batch name`
FROM events;

-- @case mysql-window-functions-and-named-window
-- @expect {"types":["Select"],"tables":[{"name":"orders","access":"read"}],"functions":["ROW_NUMBER","SUM","AVG"],"risks":[]}
SELECT ROW_NUMBER() OVER (
         PARTITION BY customer_id ORDER BY created_at
         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
       ),
       SUM(total) OVER totals,
       AVG(total) OVER (totals ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING)
FROM orders
WINDOW totals AS (ORDER BY created_at);

-- @case mysql-quoted-identifiers-qualified-columns-and-stored-functions
-- @expect {"types":["Select","Select"],"tables":[{"name":"order`history","access":"read"},{"db":"shop","name":"orders","access":"read"}],"functions":["shop.LABEL","shop.SLEEP"],"risks":[]}
SELECT `select`, `a``b` FROM `order``history`;
SELECT shop.orders.id, shop.orders.*, shop.label(1), shop.sleep(1)
FROM shop.orders;

-- @case mysql-locking-reads
-- @expect {"types":["Select","Select","Select"],"tables":[{"name":"orders","access":"read"},{"name":"inventory","access":"read"},{"name":"customers","access":"read"}],"risks":[]}
SELECT * FROM orders WHERE id = 1 FOR UPDATE SKIP LOCKED;
SELECT * FROM inventory LOCK IN SHARE MODE;
SELECT * FROM customers WHERE id = 2 FOR SHARE NOWAIT;

-- @case mysql-literal-kinds-and-string-escaping
-- @expect {"types":["Select"],"tables":[],"functions":[],"risks":[],"comments":[]}
SELECT 18446744073709551615, 0xFF, X'0a', B'01',
       _utf8mb4'你好' COLLATE utf8mb4_bin, N'national',
       DATE '2024-01-01', TIME '12:34:56', TIMESTAMP '2024-01-01 12:34:56',
       'it''s', 'a\nb', 'a' 'b', 1.5e3, .5, TRUE, FALSE, NULL;

-- @case mysql-arithmetic-bitwise-and-boolean-precedence
-- @expect {"types":["Select"],"tables":[{"name":"metrics","access":"read"}],"risks":[]}
SELECT NOT a = 1, !a, -a, +a, ~a, BINARY label,
       a + b * c, (a + b) * c, a / 2, a % 2, a DIV 2, a MOD 2,
       a ^ b, a << 1, a >> 1, a | b & c,
       a XOR b, a OR b AND c, (a OR b) AND NOT (c AND d),
       a && b || c, 1--2
FROM metrics;

-- @case mysql-between-in-and-quantified-subqueries
-- @expect {"types":["Select"],"tables":[{"name":"orders","access":"read"},{"name":"blocked_customers","access":"read"},{"name":"limits","access":"read"}],"risks":[]}
SELECT * FROM orders
WHERE total BETWEEN 1 AND 100
  AND id NOT BETWEEN 1 AND 2
  AND customer_id NOT IN (SELECT customer_id FROM blocked_customers)
  AND total = ANY (SELECT amount FROM limits)
  AND total <= ALL (SELECT amount FROM limits)
  AND total > SOME (SELECT amount FROM limits);

-- @case mysql-pattern-null-safe-and-json-membership-comparisons
-- @expect {"types":["Select"],"tables":[{"name":"events","access":"read"}],"risks":[]}
SELECT * FROM events
WHERE label LIKE 'x!%' ESCAPE '!'
  AND label NOT LIKE 'archived%'
  AND label REGEXP '^a' AND label NOT RLIKE 'b'
  AND label RLIKE 'c' AND label NOT REGEXP 'z$'
  AND deleted_at <=> NULL AND active IS UNKNOWN
  AND active IS NOT FALSE AND id <> 2 AND id != 3 AND id >= 1
  AND 1 MEMBER OF (payload);

-- @case mysql-fulltext-match-modes
-- @expect {"types":["Select","Select"],"tables":[{"name":"articles","access":"read"},{"name":"articles","access":"read"}],"risks":[]}
SELECT * FROM articles
WHERE MATCH (title, body) AGAINST ('+database -legacy' IN BOOLEAN MODE);
SELECT * FROM articles
WHERE MATCH (body) AGAINST ('database' IN NATURAL LANGUAGE MODE WITH QUERY EXPANSION);

-- @case mysql-row-constructors-scalar-subquery-and-not-exists
-- @expect {"types":["Select"],"tables":[{"name":"payments","access":"read"},{"name":"orders","access":"read"},{"name":"refunds","access":"read"}],"functions":["MAX"],"risks":[]}
SELECT (SELECT MAX(amount) FROM payments WHERE order_id = o.id) AS largest_payment
FROM orders o
WHERE (customer_id, id) IN ((1, 2), (3, 4))
  AND NOT EXISTS (SELECT 1 FROM refunds WHERE refunds.order_id = o.id);

-- @case mysql-keyword-named-functions
-- @expect {"types":["Select"],"tables":[{"name":"orders","access":"read"}],"functions":["IF","LEFT","RIGHT","REPLACE","MOD"],"risks":[]}
SELECT IF(total > 0, LEFT(note, 1), RIGHT(note, 1)),
       REPLACE(note, 'old', 'new'), MOD(id, 2)
FROM orders;

-- @case mysql-file-exports-and-variable-targets
-- @expect {"types":["Select","Select","Select"],"tables":[{"name":"orders","access":"read"},{"name":"documents","access":"read"},{"name":"orders","access":"read"}],"risks":["into-file","into-file"]}
SELECT id FROM orders INTO OUTFILE '/tmp/orders.csv'
CHARACTER SET utf8mb4 FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n';
SELECT content FROM documents WHERE id = 1 INTO DUMPFILE '/tmp/document.bin';
SELECT id, total INTO @order_id, @total FROM orders WHERE id = 1;

-- @case mysql-explain-formats-and-describe
-- @expect {"types":["Explain","Explain","Explain","Describe"],"tables":[{"name":"orders","access":"read"}],"risks":[]}
EXPLAIN FORMAT=JSON SELECT 1;
EXPLAIN FORMAT=TREE SELECT 1;
EXPLAIN FORMAT=TRADITIONAL SELECT 1;
DESC orders;

-- @case mysql-use-and-set-scopes
-- @expect {"types":["Use","Set","Set"],"tables":[],"risks":[]}
USE shop;
SET @batch_id = 1, sql_mode = 'STRICT_TRANS_TABLES',
    GLOBAL max_connections = 100, @@session.autocommit = ON;
SET LOCAL sql_mode = DEFAULT, PERSIST max_connections = 200;

-- @case mysql-truncate-drop-tables-view-and-database
-- @expect {"types":["Truncate","Drop","Drop","Drop"],"tables":[{"name":"staging_orders","access":"write"},{"name":"scratch","access":"write"},{"db":"shop","name":"old_orders","access":"write"},{"name":"old_order_summary","access":"write"}],"risks":["truncate","drop","drop","drop"]}
TRUNCATE TABLE staging_orders;
DROP TEMPORARY TABLE IF EXISTS scratch, shop.old_orders;
DROP VIEW IF EXISTS old_order_summary;
DROP DATABASE old_reporting;

-- @case mysql-ctas-definition-options-and-optional-as
-- @expect {"types":["Create","Create","Create"],"tables":[{"name":"order_ids","access":"write"},{"name":"orders","access":"read"},{"name":"order_snapshot","access":"write"},{"name":"orders","access":"read"},{"name":"pending_order_ids","access":"write"},{"name":"orders","access":"read"}],"risks":["ddl","ddl","ddl"]}
CREATE TABLE order_ids (id INT) AS SELECT id FROM orders;
CREATE TABLE IF NOT EXISTS order_snapshot ENGINE=InnoDB AS SELECT * FROM orders;
CREATE TABLE pending_order_ids SELECT id FROM orders WHERE status = 'pending';

-- @case mysql-create-like-and-foreign-key-references
-- @expect {"types":["Create","Create"],"tables":[{"name":"order_template","access":"write"},{"db":"shop","name":"orders","access":"read"},{"name":"order_items","access":"write"},{"db":"shop","name":"orders","access":"read"}],"risks":["ddl","ddl"]}
CREATE TEMPORARY TABLE order_template LIKE shop.orders;
CREATE TABLE order_items (
  id INT,
  order_id INT,
  FOREIGN KEY (order_id) REFERENCES shop.orders(id)
);

-- @case mysql-create-view-query-columns-and-security-options
-- @expect {"types":["Create","Create","Create","Create"],"tables":[{"name":"order_ids","access":"write"},{"name":"orders","access":"read"},{"name":"order_ids","access":"write"},{"name":"orders","access":"read"},{"name":"active_orders","access":"write"},{"name":"orders","access":"read"},{"name":"admin_orders","access":"write"},{"name":"orders","access":"read"}],"risks":["ddl","ddl","ddl","ddl"]}
CREATE VIEW order_ids AS SELECT id FROM orders;
CREATE OR REPLACE VIEW order_ids (id) AS SELECT id FROM orders;
CREATE ALGORITHM=MERGE SQL SECURITY INVOKER VIEW active_orders AS
SELECT * FROM orders WHERE status = 'paid' WITH CASCADED CHECK OPTION;
CREATE DEFINER=`reporter`@`%` VIEW admin_orders AS SELECT * FROM orders;

-- @case mysql-create-database
-- @expect {"types":["Create"],"tables":[],"functions":[],"risks":["ddl"]}
CREATE DATABASE IF NOT EXISTS reporting DEFAULT CHARACTER SET utf8mb4;

-- @case mysql-create-index-kinds-and-options
-- @expect {"types":["CreateIndex","CreateIndex","CreateIndex","CreateIndex"],"tables":[{"name":"orders","access":"write"},{"name":"articles","access":"write"},{"name":"places","access":"write"},{"name":"orders","access":"write"}],"risks":["ddl","ddl","ddl","ddl"]}
CREATE UNIQUE INDEX ix_order ON orders (id);
CREATE FULLTEXT INDEX ix_body ON articles (body);
CREATE SPATIAL INDEX ix_location ON places (location);
CREATE INDEX ix_customer USING BTREE ON orders (customer_id)
COMMENT 'customer lookup' VISIBLE ALGORITHM=INPLACE LOCK=NONE;

-- @case mysql-alter-add-rename-column-and-multiple-actions
-- @expect {"types":["AlterTable","AlterTable","AlterTable","AlterTable","AlterTable"],"tables":[{"name":"orders","access":"write"},{"name":"orders","access":"write"},{"name":"archived_orders","access":"write"},{"name":"orders","access":"write"},{"name":"archived_orders","access":"write"},{"name":"orders","access":"write"},{"name":"archived_orders","access":"write"},{"name":"orders","access":"write"}],"risks":["ddl","ddl","ddl","ddl","ddl"]}
ALTER TABLE orders ADD COLUMN created_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN note VARCHAR(100), RENAME TO archived_orders;
ALTER TABLE orders RENAME TO archived_orders, ADD COLUMN note VARCHAR(100);
ALTER TABLE orders RENAME archived_orders;
ALTER TABLE orders RENAME COLUMN note TO description;

-- @case mysql-alter-exchange-foreign-key-and-preserved-comment-string
-- @expect {"types":["AlterTable","AlterTable","AlterTable"],"tables":[{"name":"orders","access":"write"},{"name":"staging_orders","access":"write"},{"name":"order_items","access":"write"},{"db":"shop","name":"orders","access":"read"},{"name":"orders","access":"write"}],"risks":["ddl","ddl","ddl"]}
ALTER TABLE orders EXCHANGE PARTITION p2024 WITH TABLE staging_orders WITHOUT VALIDATION;
ALTER TABLE order_items ADD CONSTRAINT fk_order FOREIGN KEY (order_id) REFERENCES shop.orders(id);
ALTER TABLE orders COMMENT 'monthly  orders; retain two spaces';

-- @case mysql-load-data-local-partition-and-audited-assignments
-- @expect {"types":["LoadData","LoadData"],"tables":[{"name":"staging_orders","access":"write"},{"name":"staging_orders","access":"write"},{"name":"import_history","access":"read"}],"functions":["SLEEP","MAX"],"risks":["load-data","load-data","dangerous-function"]}
LOAD DATA LOCAL INFILE '/tmp/orders.csv' REPLACE INTO TABLE staging_orders
PARTITION (p2024) FIELDS TERMINATED BY ',' LINES TERMINATED BY '\n';
LOAD DATA LOW_PRIORITY INFILE '/tmp/orders.csv' INTO TABLE staging_orders
FIELDS TERMINATED BY ','
SET delay = SLEEP(5), batch_id = (SELECT MAX(id) FROM import_history);

-- @case mysql-rename-multiple-qualified-tables
-- @expect {"types":["Rename"],"tables":[{"name":"orders","access":"write"},{"name":"old_orders","access":"write"},{"db":"shop","name":"staging_orders","access":"write"},{"db":"shop","name":"orders","access":"write"}],"risks":["rename"]}
RENAME TABLE orders TO old_orders, shop.staging_orders TO shop.orders;

-- @case mysql-table-lock-modes-and-aliases
-- @expect {"types":["LockTables","LockTables"],"tables":[{"name":"orders","access":"read"},{"name":"staging_orders","access":"write"},{"name":"customers","access":"read"}],"risks":["lock-tables","lock-tables"]}
LOCK TABLES orders READ, staging_orders WRITE;
LOCK TABLE customers AS c READ LOCAL;

-- @case mysql-native-table-options-and-partitions
-- @expect {"types":["Create","Create","Create"],"risks":["ddl","ddl","ddl"]}
CREATE TABLE orders (id INT)
ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='DISTRIBUTED  PROPERTIES';
CREATE TABLE hashed_orders (id INT) ENGINE=InnoDB PARTITION BY HASH(id) PARTITIONS 4;
CREATE TABLE ranged_orders (id INT)
PARTITION BY RANGE(id) (PARTITION p0 VALUES LESS THAN (10));

-- @case mysql-native-storage-table-options
-- @expect {"types":["Create","Create","Create","Create","Create"],"risks":["ddl","ddl","ddl","ddl","ddl"]}
CREATE TABLE extended_orders (id INT) TABLESPACE ts1 AUTOEXTEND_SIZE=4194304;
CREATE TABLE sized_orders (id INT) AUTOEXTEND_SIZE=4M;
CREATE TABLE merged_orders (id INT) ENGINE=MRG_MyISAM UNION=(orders_2024, orders_2025);
CREATE TABLE rapid_orders (id INT) SECONDARY_ENGINE=RAPID;
CREATE TABLE atomic_orders (id INT) START TRANSACTION;

-- @case mysql-unknown-statements-and-empty-statement-delimiters
-- @expect {"types":["Select","Unknown","Unknown","Unknown"],"tables":[{"name":"orders","access":"read"}],"risks":["unknown-statement","unknown-statement","unknown-statement"]}
SELECT id FROM orders WHERE id = ?;
;
SHOW TABLES;
SET NAMES utf8mb4;
GRANT SELECT ON shop.* TO 'reporter'@'localhost';

-- @case mysql-dangerous-functions-and-qualified-function-boundary
-- @expect {"types":["Select","Select"],"tables":[],"functions":["SLEEP","BENCHMARK","SHA2","LOAD_FILE","GET_LOCK","RELEASE_ALL_LOCKS","SYS_EXEC","SYS_EVAL","audit.SLEEP"],"risks":["dangerous-function"]}
SELECT SLEEP(1), BENCHMARK(10, SHA2('sample', 256)), LOAD_FILE('/etc/hostname'),
       GET_LOCK('import_batch', 0), RELEASE_ALL_LOCKS(), SYS_EXEC('id'), SYS_EVAL('id');
SELECT audit.sleep(1);

-- @case mysql-nonreserved-identifiers
-- @expect {"types":["Select"],"tables":[{"name":"data","access":"read"}],"risks":[]}
SELECT data, tables, local, status, comment FROM data;

-- @case mysql-comments-hints-and-active-version-guard
-- @options {"mysqlVersion":80400}
-- @expect {"types":["Select"],"tables":[{"name":"orders","access":"read"}],"functions":[],"risks":[],"comments":["block","hint","executable","line"]}
/* report; keep this comment */
SELECT /*+ MAX_EXECUTION_TIME(1000) */ id FROM orders
/*!80000 WHERE id > 0 */;
# report finished; this is still one comment

-- @case mysql-comments-between-predicate-tokens
-- @expect {"types":["Select"],"tables":[{"name":"orders","access":"read"}],"comments":["line","line","block"]}
SELECT * FROM orders
WHERE id = 1 # lookup; not a statement separator
-- retain the next predicate
AND total > 0 /* validated; amount */;

-- @case mysql-comment-only-script
-- @expect {"types":[],"tables":[],"functions":[],"risks":[],"comments":["block","line","line"]}
/* no statements; */;
-- a second comment
# a third comment

-- @case mysql-nested-query-hints-and-ddl-comments
-- @expect {"types":["Select","Create"],"tables":[{"name":"scratch","access":"write"}],"functions":[],"risks":["ddl"],"comments":["hint","hint","block","block"]}
SELECT /*+ QB_NAME(outer_q) */ *
FROM (SELECT /*+ QB_NAME(inner_q) */ 1 AS id) constants;
CREATE TABLE scratch (id INT /* column comment; */) /* table comment */;

-- @case mysql-comment-like-text-in-quoted-tokens
-- @expect {"types":["Select","Select"],"tables":[{"name":"a`#b","access":"read"}],"functions":[],"risks":[],"comments":[]}
SELECT '/*! SELECT sleep(1); */', "/*+ HINT(); */", 'it''s /*x*/',
       'escaped\'/*!x*/', "it""s #x", "escaped\"-- x", 'a;b';
SELECT `col/*x*/` FROM `a``#b`;

-- @case mysql-executable-looking-text-in-ordinary-comments
-- @expect {"types":["Select"],"tables":[],"functions":[],"risks":[],"comments":["line","line","block"]}
# /*! SELECT sleep(1); */
-- /*! DROP TABLE orders; */
SELECT 1 /* /*! hidden */;

-- @case mysql-double-dash-arithmetic-and-trailing-comment
-- @expect {"types":["Select","Select"],"tables":[],"functions":[],"risks":[],"comments":["line"]}
SELECT 1--2;
SELECT 1 --
;

-- @case mysql-executable-statements-and-unversioned-expression
-- @expect {"types":["Unknown","Select"],"tables":[],"functions":["SLEEP"],"risks":["unknown-statement","dangerous-function"],"comments":["executable","executable","block"]}
/*!40101 SET NAMES utf8 */;
SELECT /*! SLEEP(1), */ 1 /* ordinary */;

-- @case mysql-executable-version-guard-active-at-boundary
-- @options {"mysqlVersion":80000}
-- @expect {"types":["Select"],"tables":[],"functions":["SLEEP"],"risks":["dangerous-function"],"comments":["executable"]}
SELECT '😀',
/*!80000 SLEEP(1),
*/ 1;

-- @case mysql-executable-version-guard-inactive
-- @options {"mysqlVersion":50700}
-- @expect {"types":["Select"],"tables":[],"functions":[],"risks":[],"comments":["executable"]}
SELECT /*!80000 SLEEP(1), */ 1;

-- @case mysql-executable-expansion-disabled
-- @options {"mysqlVersion":80400,"executableComments":false}
-- @expect {"types":["Select"],"tables":[],"functions":[],"risks":[],"comments":["executable","executable"]}
/*!40101 SET NAMES utf8 */;
SELECT /*!80000 SLEEP(1), */ 1;

-- @case mysql-five-six-and-short-version-prefixes
-- @options {"mysqlVersion":80400}
-- @expect {"types":["Select"],"tables":[],"functions":[],"risks":[],"comments":["executable","executable","executable"]}
/*!80400 SELECT 1 */;
/*!100000 SELECT 2 */;
/*!123 ignored */;

-- @case mysql-mysqldump-partition-version-comment
-- @expect {"types":["Create"],"tables":[{"name":"orders","access":"write"}],"risks":["ddl"],"comments":["executable"]}
CREATE TABLE orders (id INT) ENGINE=InnoDB
/*!50100 PARTITION BY RANGE(id) (PARTITION p0 VALUES LESS THAN (10)) */;

-- @case mysql-ordinary-custom-hint-text
-- @expect {"types":["Select"],"functions":[],"risks":[],"comments":["block"]}
SELECT 1 /* !hint custom content; */;

-- @case mysql-cte-update-and-delete-dependencies
-- @expect {"types":["Update","Delete"],"tables":[{"name":"deliveries","access":"read"},{"name":"inventory","access":"write"},{"name":"cancelled_orders","access":"read"},{"name":"orders","access":"write"}],"risks":[]}
WITH incoming AS (SELECT sku, quantity FROM deliveries)
UPDATE inventory i JOIN incoming d ON i.sku = d.sku
SET i.quantity = d.quantity WHERE d.quantity > 0;
WITH cancelled AS (SELECT id FROM cancelled_orders)
DELETE FROM orders WHERE id IN (SELECT id FROM cancelled);

-- @case mysql-parameterized-limit-and-derived-column-names
-- @expect {"types":["Select","Select"],"tables":[{"name":"orders","access":"read"}],"functions":[],"risks":[]}
SELECT id FROM orders WHERE total > ? LIMIT ? OFFSET ?;
SELECT constants.id FROM (SELECT 1) AS constants (id);

-- @case mysql-ctas-ignore-and-replace-query-modifiers
-- @expect {"types":["Create","Create"],"tables":[{"name":"order_ids","access":"write"},{"name":"orders","access":"read"},{"name":"order_ids","access":"write"},{"name":"orders","access":"read"}],"risks":["ddl","ddl"]}
CREATE TABLE order_ids (id INT PRIMARY KEY) IGNORE AS SELECT id FROM orders;
CREATE TABLE order_ids (id INT PRIMARY KEY) REPLACE AS SELECT id FROM orders;

-- @case mysql-load-concurrent-ignore
-- @expect {"types":["LoadData"],"tables":[{"name":"staging_orders","access":"write"}],"risks":["load-data"]}
LOAD DATA CONCURRENT INFILE '/tmp/orders.csv' IGNORE INTO TABLE staging_orders
FIELDS TERMINATED BY ',' IGNORE 1 LINES;

-- @case mysql-cte-file-export-risk
-- @expect {"types":["Select"],"tables":[{"name":"orders","access":"read"}],"functions":[],"risks":["into-file"]}
WITH recent AS (SELECT id FROM orders WHERE created_at >= DATE '2024-01-01')
SELECT id FROM recent INTO OUTFILE '/tmp/recent-orders.csv';

-- @case mysql-mixed-set-precedence
-- @expect {"types":["SetOp"],"tables":[],"risks":[]}
SELECT 1 UNION SELECT 2 INTERSECT SELECT 3 EXCEPT SELECT 4;

-- @case mysql-parenthesized-query-keeps-both-limits
-- @expect {"types":["QueryGroup"],"tables":[{"name":"orders","access":"read"}],"risks":[]}
(SELECT id FROM orders ORDER BY id LIMIT 1) ORDER BY id DESC LIMIT 5;

-- @case mysql-json-table-nested-columns
-- @expect {"types":["Select"],"tables":[{"name":"events","access":"read"}],"functions":[],"risks":[]}
SELECT e.id, jt.n, jt.tag FROM events e
JOIN JSON_TABLE(e.payload, '$.items[*]' COLUMNS (
  n FOR ORDINALITY,
  has_tag INT EXISTS PATH '$.tag',
  NESTED PATH '$.tags[*]' COLUMNS (tag VARCHAR(40) PATH '$' DEFAULT '"missing"' ON EMPTY NULL ON ERROR)
)) jt ON jt.n > 0;

-- @case mysql-into-after-query-tail
-- @expect {"types":["Select"],"tables":[{"name":"orders","access":"read"}],"risks":[]}
SELECT id FROM orders ORDER BY id LIMIT 1 FOR UPDATE OF orders NOWAIT INTO @id;

-- @case mysql-set-operation-file-destination
-- @expect {"types":["SetOp"],"tables":[{"name":"orders","access":"read"},{"name":"archived_orders","access":"read"}],"risks":["into-file"]}
SELECT id FROM orders UNION SELECT id FROM archived_orders
ORDER BY id LIMIT 10 INTO OUTFILE '/tmp/orders.csv';

-- @case mysql-structured-interval-window-and-lock-targets
-- @expect {"types":["Select"],"tables":[{"name":"orders","access":"read"}],"functions":["SUM"],"risks":[]}
SELECT SUM(total) OVER (ORDER BY created_at RANGE BETWEEN INTERVAL 1 DAY PRECEDING AND CURRENT ROW)
FROM orders AS Mixed FOR SHARE OF Mixed SKIP LOCKED;

-- @case mysql-lex-backtick-spaces-unicode-digit-dollar
-- @expect {"types":["Select"]}
SELECT `a b`, `ünï`, `1abc`, `$x` FROM t;

-- @case mysql-lex-backtick-doubled-in-alias
-- @expect {"types":["Select"]}
SELECT `a``b` AS `c``d` FROM t;

-- @case mysql-lex-float-then-bare-alias
-- @expect {"types":["Select"]}
SELECT 1e3, 1e3 x FROM t;

-- @case mysql-lex-dollar-in-unquoted-identifiers
-- @expect {"types":["Select"]}
SELECT $a, a$b FROM t;

-- @case mysql-lex-nonreserved-keywords-as-columns
-- @expect {"types":["Select"]}
SELECT status, date, time, year, text, data, value, position, comment, action, any FROM t;

-- @case mysql-lex-nonreserved-keywords-as-aliases
-- @expect {"types":["Select"]}
SELECT a AS status, b AS date, c AS timestamp FROM t;

-- @case mysql-lex-quoted-reserved-window-names-as-aliases
-- @expect {"types":["Select"]}
SELECT a AS `rank`, b AS `window`, c AS `order`, d `group` FROM t;

-- @case mysql-lex-spaces-around-qualifier-dots
-- @expect {"types":["Select"]}
SELECT t . a, t .a, t. a FROM t;

-- @case mysql-lex-spaced-three-part-name
-- @expect {"types":["Select"]}
SELECT shop . t . a FROM shop . t;

-- @case mysql-lex-string-aliases
-- @expect {"types":["Select"]}
SELECT a AS 'x y', b 'z', c AS "w" FROM t;

-- @case mysql-lex-double-quoted-string-literals
-- @expect {"types":["Select"]}
SELECT "double" = 'double', "a""b" FROM t;

-- @case mysql-lex-backslash-escapes-known-and-unknown
-- @expect {"types":["Select"]}
SELECT '\'', '\"', '\\', '\%', '\_', '\0', '\Z', '\b', '\q', '\t\r\n';

-- @case mysql-lex-adjacent-strings-across-newlines
-- @expect {"types":["Select"]}
SELECT 'a' 'b'
  'c', 'x'

'y';

-- @case mysql-lex-adjacent-mixed-quote-strings
-- @expect {"types":["Select"]}
SELECT 'a' "b" 'c';

-- @case mysql-lex-adjacent-strings-with-aliases
-- @expect {"types":["Select"]}
SELECT 'a' 'b' AS c, 'd' e;

-- @case mysql-lex-charset-introducers-and-collate
-- @expect {"types":["Select"]}
SELECT _utf8mb4'x', _binary'y', _latin1'z' COLLATE latin1_bin;

-- @case mysql-lex-introducer-with-adjacent-string
-- @expect {"types":["Select"]}
SELECT _utf8mb4'a' 'b';

-- @case mysql-lex-national-strings
-- @expect {"types":["Select"]}
SELECT N'a', n'b', N'c' 'd';

-- @case mysql-lex-hex-literal-forms
-- @expect {"types":["Select"]}
SELECT X'4142', x'', 0x0, 0xabcDEF;

-- @case mysql-lex-bit-literal-forms
-- @expect {"types":["Select"]}
SELECT b'101', B'', 0b1, 0b0101;

-- @case mysql-lex-bit-literal-with-string-alias
-- @expect {"types":["Select"]}
SELECT b'1' 'x';

-- @case mysql-lex-numeric-literal-forms
-- @expect {"types":["Select"]}
SELECT .5, 5., 1e10, 1E-3, 1.e3, -0, 00012, 1.5E+3;

-- @case mysql-lex-very-long-numeric-literals
-- @expect {"types":["Select"]}
SELECT 123456789012345678901234567890123456789012345678901234567890, 0.000000000000000000000000000000000000000001;

-- @case mysql-lex-user-variable-forms
-- @expect {"types":["Select"]}
SELECT @a, @`a b`, @'a', @"a", @a.b, @1, @_x$;

-- @case mysql-lex-user-variable-assignment
-- @expect {"types":["Select"]}
SELECT @a:=1, @b := @a + 1;

-- @case mysql-lex-system-variable-scopes
-- @expect {"types":["Select"]}
SELECT @@sql_mode, @@global.sql_mode, @@SESSION.sql_mode, @@local.sql_mode, @@`version`, @@global.`sql_mode`;

-- @case mysql-lex-tab-and-crlf-whitespace
-- @expect {"types":["Select"]}
SELECT	1
,2
FROM	t;

-- @case mysql-lex-mixed-case-keywords
-- @expect {"types":["Select"]}
sElEcT a fRoM t wHeRe a iS nOt NuLl;

-- @case mysql-lex-placeholders-in-list-and-limit
-- @expect {"types":["Select"]}
SELECT ? , ? + ? FROM t WHERE a IN (?, ?) LIMIT ?, ?;

-- @case mysql-lex-placeholders-in-like-escape-and-order
-- @expect {"types":["Select"]}
SELECT a FROM t WHERE a LIKE ? ESCAPE ? ORDER BY ?;

-- @case mysql-lex-placeholders-in-cast-is-and-unary
-- @expect {"types":["Select"]}
SELECT CAST(? AS CHAR), ? IS NULL, -?;

-- @case mysql-lex-collate-with-string-name
-- @expect {"types":["Select"]}
SELECT 'a' COLLATE 'utf8mb4_bin';

-- @case mysql-lex-block-comments-as-separators
-- @expect {"types":["Select"],"comments":["block","block","block"]}
SELECT/**/1/**/FROM/**/t;

-- @case mysql-lex-double-dash-space-starts-comment
-- @expect {"types":["Select"],"comments":["line"]}
SELECT 1-- 1;

-- @case mysql-lex-double-dash-no-space-is-minus-minus
-- @expect {"types":["Select"],"comments":[]}
SELECT 1 --1, a--b FROM t;

-- @case mysql-lex-hash-comment-mid-line
-- @expect {"types":["Select"],"comments":["line"]}
SELECT 1 # x
, 2;

-- @case mysql-lex-hash-comment-without-space
-- @expect {"types":["Select"],"comments":["line"]}
SELECT 1#x
;

-- @case mysql-expr-not-between-precedence
-- @expect {"types":["Select"]}
SELECT NOT a BETWEEN 1 AND 2 FROM t;

-- @case mysql-expr-bang-between-precedence
-- @expect {"types":["Select"]}
SELECT !a BETWEEN 1 AND 2 FROM t;

-- @case mysql-expr-chained-equality-and-less-than
-- @expect {"types":["Select"]}
SELECT a = b = c, a < b < c FROM t;

-- @case mysql-expr-unary-minus-tilde-bang-stacking
-- @expect {"types":["Select"]}
SELECT -a * b, - - a, -(-a), ~ ~a, !!a FROM t;

-- @case mysql-expr-is-not-null-is-true-chain
-- @expect {"types":["Select"]}
SELECT a IS NOT NULL IS TRUE FROM t;

-- @case mysql-expr-double-not
-- @expect {"types":["Select"]}
SELECT NOT NOT a FROM t;

-- @case mysql-expr-xor-chains-with-or-and
-- @expect {"types":["Select"]}
SELECT a XOR b XOR c, a OR b XOR c AND d FROM t;

-- @case mysql-expr-pipes-and-ampersands-default-mode
-- @expect {"types":["Select"]}
SELECT a || b && c FROM t;

-- @case mysql-expr-bitwise-with-comparison-and-shifts
-- @expect {"types":["Select"]}
SELECT a & b = c, a | b ^ c, a << 2 >> 1 FROM t;

-- @case mysql-expr-div-mod-percent-negative
-- @expect {"types":["Select"]}
SELECT -7 DIV 2, -7 MOD 2, -7 % 2, a MOD -b FROM t;

-- @case mysql-expr-null-safe-and-not-equal-forms
-- @expect {"types":["Select"]}
SELECT a <=> b, a <> b, a != b FROM t;

-- @case mysql-expr-is-true-false-unknown
-- @expect {"types":["Select"]}
SELECT a IS TRUE, a IS NOT FALSE, a IS UNKNOWN, a IS NOT UNKNOWN FROM t;

-- @case mysql-expr-quantified-any-some-all-subqueries
-- @expect {"types":["Select"]}
SELECT * FROM t WHERE a = ANY (SELECT a FROM t1) AND b > SOME (SELECT b FROM t2) AND c <> ALL (SELECT x FROM t3);

-- @case mysql-expr-between-and-and-chain
-- @expect {"types":["Select"]}
SELECT a BETWEEN b AND c AND d FROM t;

-- @case mysql-expr-between-parenthesized-and-bound
-- @expect {"types":["Select"]}
SELECT a BETWEEN (b AND c) AND d FROM t;

-- @case mysql-expr-not-between
-- @expect {"types":["Select"]}
SELECT a NOT BETWEEN 1 AND 2 FROM t;

-- @case mysql-expr-in-single-row-and-nested-parens
-- @expect {"types":["Select"]}
SELECT a IN (1), (a, b) IN ((1, 2), (3, 4)), a IN ((1)) FROM t;

-- @case mysql-expr-in-subquery-with-union
-- @expect {"types":["Select"]}
SELECT * FROM t WHERE a IN (SELECT a FROM t1 UNION SELECT a FROM t2);

-- @case mysql-expr-not-in-subquery
-- @expect {"types":["Select"]}
SELECT * FROM t WHERE a NOT IN (SELECT a FROM t1);

-- @case mysql-expr-like-escape-expression-not-like-rlike
-- @expect {"types":["Select"]}
SELECT name LIKE 'a|%' ESCAPE CONCAT('|'), name NOT LIKE 'x%', name RLIKE '^a' FROM t;

-- @case mysql-expr-like-escape-empty
-- @expect {"types":["Select"]}
SELECT name LIKE 'a' ESCAPE '' FROM t;

-- @case mysql-expr-member-of
-- @expect {"types":["Select"]}
SELECT 1 MEMBER OF (j) FROM t;

-- @case mysql-expr-collate-precedence
-- @expect {"types":["Select"]}
SELECT a COLLATE utf8mb4_bin = b, 'a' COLLATE utf8mb4_bin LIKE 'A' FROM t;

-- @case mysql-expr-binary-operator-stacking
-- @expect {"types":["Select"]}
SELECT BINARY a = b, BINARY BINARY a FROM t;

-- @case mysql-expr-interval-arithmetic-both-sides
-- @expect {"types":["Select"]}
SELECT dt + INTERVAL 1 DAY, INTERVAL 1 DAY + dt, dt - INTERVAL '1:2' HOUR_MINUTE, dt + INTERVAL (1+1) DAY FROM t;

-- @case mysql-expr-interval-units-microsecond-quarter-week
-- @expect {"types":["Select"]}
SELECT dt + INTERVAL 1 MICROSECOND, dt + INTERVAL 1 QUARTER, dt + INTERVAL '1-2' YEAR_MONTH, dt + INTERVAL '1 1:1:1.1' DAY_MICROSECOND, dt + INTERVAL 1 WEEK FROM t;

-- @case mysql-expr-interval-compound-units
-- @expect {"types":["Select"]}
SELECT dt + INTERVAL '1:1.1' MINUTE_MICROSECOND, dt + INTERVAL '1:1:1.1' HOUR_MICROSECOND, dt + INTERVAL '1.1' SECOND_MICROSECOND, dt + INTERVAL '1:1' MINUTE_SECOND, dt + INTERVAL '1:1:1' HOUR_SECOND, dt + INTERVAL '1 1' DAY_HOUR, dt + INTERVAL '1 1:1' DAY_MINUTE, dt + INTERVAL '1 1:1:1' DAY_SECOND FROM t;

-- @case mysql-expr-assignment-in-select-list
-- @expect {"types":["Select"]}
SELECT @a := 1, @b := @a + 1 FROM t;

-- @case mysql-expr-assignment-in-where
-- @expect {"types":["Select"]}
SELECT * FROM t WHERE (@a := a) > 1;

-- @case mysql-expr-row-constructor-comparisons
-- @expect {"types":["Select"]}
SELECT ROW(1, 2) = (1, 2), (a, b) < (1, 2), (a, (b, c)) = (1, (2, 3)) FROM t;

-- @case mysql-expr-case-without-else-and-nested
-- @expect {"types":["Select"]}
SELECT CASE a WHEN 1 THEN 'x' END, CASE WHEN a THEN CASE WHEN b THEN 1 ELSE 2 END END FROM t;

-- @case mysql-expr-case-with-subqueries
-- @expect {"types":["Select"]}
SELECT CASE WHEN EXISTS (SELECT 1 FROM t1) THEN (SELECT MAX(a) FROM t2) END FROM t;

-- @case mysql-expr-deeply-nested-parens
-- @expect {"types":["Select"]}
SELECT ((((((a + 1)))))) * (((b))) FROM t;

-- @case mysql-expr-json-arrow-operators-qualified
-- @expect {"types":["Select"]}
SELECT j->'$.a', j->>'$.a', t.j->'$', t.j->>'$' = 'x' FROM t;

-- @case mysql-expr-exists-precedence
-- @expect {"types":["Select"]}
SELECT NOT EXISTS (SELECT 1 FROM t1), EXISTS (SELECT 1 FROM t1) = 1 FROM t;

-- @case mysql-expr-user-variable-increment
-- @expect {"types":["Select"]}
SELECT @a := @a + 1 FROM t;

-- @case mysql-expr-not-bang
-- @expect {"types":["Select"]}
SELECT NOT ! a FROM t;

-- @case mysql-expr-equals-bang-operand
-- @expect {"types":["Select"]}
SELECT a = !b FROM t;

-- @case mysql-expr-is-null-is-null-chain
-- @expect {"types":["Select"]}
SELECT a IS NULL IS NULL FROM t;

-- @case mysql-expr-unary-binds-tighter-than-is-and-collate
-- @expect {"types":["Select"]}
SELECT -a IS NULL, ~a COLLATE utf8mb4_bin FROM t;

-- @case mysql-expr-not-regexp-rlike-in
-- @expect {"types":["Select"]}
SELECT a NOT REGEXP 'x', a NOT RLIKE 'x', a NOT IN (1) FROM t;

-- @case mysql-expr-xor-bitwise-chain
-- @expect {"types":["Select"]}
SELECT a ^ b ^ c, a ^ -b FROM t;

-- @case mysql-func-cast-signed-unsigned-integer
-- @expect {"types":["Select"]}
SELECT CAST(a AS SIGNED), CAST(a AS SIGNED INTEGER), CAST(a AS UNSIGNED), CAST(a AS UNSIGNED INTEGER) FROM t;

-- @case mysql-func-cast-decimal-char-nchar-binary
-- @expect {"types":["Select"]}
SELECT CAST(a AS DECIMAL), CAST(a AS DECIMAL(10)), CAST(a AS CHAR), CAST(a AS NCHAR), CAST(a AS BINARY(4)) FROM t;

-- @case mysql-func-cast-char-charset
-- @expect {"types":["Select"]}
SELECT CAST(s AS CHAR CHARACTER SET utf8mb4), CAST(s AS CHAR(10) CHARSET latin1) FROM t;

-- @case mysql-func-cast-temporal-precision-json
-- @expect {"types":["Select"]}
SELECT CAST(dt AS DATE), CAST(dt AS DATETIME(6)), CAST(dt AS TIME(3)), CAST(s AS JSON) FROM t;

-- @case mysql-func-cast-float-real-year
-- @expect {"types":["Select"]}
SELECT CAST(a AS DOUBLE), CAST(a AS FLOAT), CAST(a AS FLOAT(10)), CAST(a AS REAL), CAST(a AS YEAR) FROM t;

-- @case mysql-func-cast-unsigned-array
-- @expect {"types":["Select"]}
SELECT CAST(j AS UNSIGNED ARRAY) FROM t;

-- @case mysql-func-cast-char-len-array
-- @expect {"types":["Select"]}
SELECT CAST(j->'$.a' AS CHAR(10) ARRAY) FROM t;

-- @case mysql-func-convert-type-and-using
-- @expect {"types":["Select"]}
SELECT CONVERT(a, SIGNED), CONVERT(a, DECIMAL(10,2)), CONVERT(s USING latin1) FROM t;

-- @case mysql-func-extract-simple-units
-- @expect {"types":["Select"],"functions":["EXTRACT"]}
SELECT EXTRACT(MICROSECOND FROM dt), EXTRACT(SECOND FROM dt), EXTRACT(MINUTE FROM dt), EXTRACT(HOUR FROM dt), EXTRACT(DAY FROM dt), EXTRACT(WEEK FROM dt), EXTRACT(MONTH FROM dt), EXTRACT(QUARTER FROM dt), EXTRACT(YEAR FROM dt) FROM t;

-- @case mysql-func-extract-compound-units
-- @expect {"types":["Select"],"functions":["EXTRACT"]}
SELECT EXTRACT(SECOND_MICROSECOND FROM dt), EXTRACT(MINUTE_MICROSECOND FROM dt), EXTRACT(MINUTE_SECOND FROM dt), EXTRACT(HOUR_MICROSECOND FROM dt), EXTRACT(HOUR_SECOND FROM dt), EXTRACT(HOUR_MINUTE FROM dt), EXTRACT(DAY_MICROSECOND FROM dt), EXTRACT(DAY_SECOND FROM dt), EXTRACT(DAY_MINUTE FROM dt), EXTRACT(DAY_HOUR FROM dt), EXTRACT(YEAR_MONTH FROM dt) FROM t;

-- @case mysql-func-trim-forms
-- @expect {"types":["Select"],"functions":["TRIM"]}
SELECT TRIM(BOTH 'x' FROM s), TRIM(TRAILING FROM s), TRIM(LEADING FROM s), TRIM('x' FROM s) FROM t;

-- @case mysql-func-substring-forms
-- @expect {"types":["Select"],"functions":["SUBSTRING","SUBSTR","MID"]}
SELECT SUBSTRING(s FROM 2), SUBSTRING(s, 2, 3), SUBSTRING(s, 2), SUBSTR(s FROM 2 FOR 3), MID(s, 2, 3) FROM t;

-- @case mysql-func-char-multi-arg
-- @expect {"types":["Select"],"functions":["CHAR"]}
SELECT CHAR(65, 66);

-- @case mysql-func-weight-string-plain
-- @expect {"types":["Select"],"functions":["WEIGHT_STRING"]}
SELECT WEIGHT_STRING(s) FROM t;

-- @case mysql-func-get-format
-- @expect {"types":["Select"],"functions":["GET_FORMAT"]}
SELECT GET_FORMAT(DATE, 'ISO'), GET_FORMAT(DATETIME, 'EUR'), GET_FORMAT(TIME, 'USA');

-- @case mysql-func-timestampadd-diff
-- @expect {"types":["Select"],"functions":["TIMESTAMPADD","TIMESTAMPDIFF","NOW"]}
SELECT TIMESTAMPADD(MINUTE, 1, dt), TIMESTAMPDIFF(MONTH, dt, NOW()), TIMESTAMPADD(SQL_TSI_DAY, 1, dt) FROM t;

-- @case mysql-func-date-add-interval-and-number
-- @expect {"types":["Select"],"functions":["DATE_ADD","DATE_SUB","ADDDATE","SUBDATE"]}
SELECT DATE_ADD(dt, INTERVAL 1 DAY), DATE_SUB(dt, INTERVAL '1:30' HOUR_MINUTE), ADDDATE(dt, 5), SUBDATE(dt, 5), ADDDATE(dt, INTERVAL 2 WEEK) FROM t;

-- @case mysql-func-interval-arithmetic-both-sides
-- @expect {"types":["Select"]}
SELECT dt + INTERVAL 1 DAY, INTERVAL 1 DAY + dt, dt - INTERVAL 1 HOUR FROM t;

-- @case mysql-func-match-against-natural
-- @expect {"types":["Select"]}
SELECT MATCH(title, body) AGAINST ('x'), MATCH(body) AGAINST ('x' IN NATURAL LANGUAGE MODE) FROM articles;

-- @case mysql-func-match-against-expansion-boolean
-- @expect {"types":["Select"]}
SELECT MATCH(title, body) AGAINST ('x' IN NATURAL LANGUAGE MODE WITH QUERY EXPANSION), MATCH(title, body) AGAINST ('+x -y' IN BOOLEAN MODE), MATCH(title, body) AGAINST ('x' WITH QUERY EXPANSION) FROM articles;

-- @case mysql-func-niladic-without-parens
-- @expect {"types":["Select"],"functions":["CURRENT_DATE","CURRENT_TIME","CURRENT_TIMESTAMP","LOCALTIME","LOCALTIMESTAMP","UTC_TIMESTAMP","UTC_DATE","UTC_TIME","CURRENT_USER"]}
SELECT CURRENT_DATE, CURRENT_TIME, CURRENT_TIMESTAMP, LOCALTIME, LOCALTIMESTAMP, UTC_TIMESTAMP, UTC_DATE, UTC_TIME, CURRENT_USER;

-- @case mysql-func-niladic-with-parens-precision
-- @expect {"types":["Select"],"functions":["CURRENT_DATE","CURRENT_TIME","CURRENT_TIMESTAMP","LOCALTIME","LOCALTIMESTAMP","UTC_TIMESTAMP","CURRENT_USER"]}
SELECT CURRENT_DATE(), CURRENT_TIME(3), CURRENT_TIMESTAMP(6), LOCALTIME(), LOCALTIMESTAMP(2), UTC_TIMESTAMP(), CURRENT_USER();

-- @case mysql-func-session-info-functions
-- @expect {"types":["Select"],"functions":["NOW","SYSDATE","USER","DATABASE","SCHEMA","VERSION","CONNECTION_ID"]}
SELECT NOW(), NOW(6), SYSDATE(), USER(), DATABASE(), SCHEMA(), VERSION(), CONNECTION_ID();

-- @case mysql-func-now-without-parens-is-column
-- @expect {"types":["Select"],"functions":[]}
SELECT NOW FROM t;

-- @case mysql-func-keyword-named-string-functions
-- @expect {"types":["Select"],"functions":["IF","LEFT","RIGHT","REPLACE","INSERT","FORMAT","MOD","REPEAT"]}
SELECT IF(a > 1, 'y', 'n'), LEFT(s, 2), RIGHT(s, 2), REPLACE(s, 'a', 'b'), INSERT(s, 1, 2, 'zz'), FORMAT(a, 2), MOD(a, 3), REPEAT(s, 2) FROM t;

-- @case mysql-func-keyword-named-temporal-functions
-- @expect {"types":["Select"],"functions":["YEAR","DATE","TIME","TIMESTAMP","MICROSECOND","MONTH","DAY","HOUR","MINUTE","SECOND","WEEK"]}
SELECT YEAR(dt), DATE(dt), TIME(dt), TIMESTAMP(dt), TIMESTAMP(dt, '01:00:00'), MICROSECOND(dt), MONTH(dt), DAY(dt), HOUR(dt), MINUTE(dt), SECOND(dt), WEEK(dt) FROM t;

-- @case mysql-func-default-charset-collation-functions
-- @expect {"types":["Select"],"functions":["DEFAULT","ASCII","CHARSET","COLLATION","COALESCE","NULLIF","ROW_COUNT"]}
SELECT DEFAULT(a), ASCII(s), CHARSET(s), COLLATION(s), COALESCE(a, b, 0), NULLIF(a, 0), ROW_COUNT() FROM t;

-- @case mysql-func-values-function
-- @expect {"types":["Select"],"functions":["VALUES"]}
SELECT VALUES(a) FROM t;

-- @case mysql-func-space-before-paren-count
-- @expect {"types":["Select"],"functions":["COUNT"]}
SELECT COUNT (a) FROM t;

-- @case mysql-func-space-before-paren-plain-arguments
-- @expect {"types":["Select"],"functions":["MAX","TRIM","SUBSTRING","ADDDATE","IF"]}
SELECT MAX (a), TRIM (s), SUBSTRING (s, 2), ADDDATE (dt, 1), CONVERT (a USING utf8mb4), IF (a, 1, 2) FROM t;

-- @case mysql-func-space-before-paren-sum
-- @expect {"types":["Select"],"functions":["SUM"]}
SELECT SUM (a) FROM t;

-- @case mysql-func-space-before-paren-upper
-- @expect {"types":["Select"],"functions":["UPPER"]}
SELECT UPPER (s) FROM t;

-- @case mysql-func-aggregate-distinct-all
-- @expect {"types":["Select"],"functions":["COUNT","SUM","AVG","MAX"]}
SELECT COUNT(*), COUNT(1), COUNT(DISTINCT a, b), COUNT(ALL a), SUM(DISTINCT a), AVG(ALL a), MAX(DISTINCT a) FROM t;

-- @case mysql-func-group-concat-variants
-- @expect {"types":["Select"],"functions":["GROUP_CONCAT"]}
SELECT GROUP_CONCAT(DISTINCT a ORDER BY b DESC, c SEPARATOR ''), GROUP_CONCAT(a, b), GROUP_CONCAT(a ORDER BY 1) FROM t;

-- @case mysql-func-json-and-bit-aggregates
-- @expect {"types":["Select"],"functions":["JSON_ARRAYAGG","JSON_OBJECTAGG","BIT_AND","BIT_OR","BIT_XOR","STD","STDDEV_SAMP","VAR_POP"]}
SELECT JSON_ARRAYAGG(a), JSON_OBJECTAGG(s, a), BIT_AND(a), BIT_OR(a), BIT_XOR(a), STD(a), STDDEV_SAMP(a), VAR_POP(a) FROM t;

-- @case mysql-func-ranking-window-functions
-- @expect {"types":["Select"],"functions":["ROW_NUMBER","RANK","DENSE_RANK","PERCENT_RANK","CUME_DIST","NTILE"]}
SELECT ROW_NUMBER() OVER (), RANK() OVER (ORDER BY a), DENSE_RANK() OVER (PARTITION BY b ORDER BY a), PERCENT_RANK() OVER w, CUME_DIST() OVER w, NTILE(4) OVER w FROM t WINDOW w AS (ORDER BY a);

-- @case mysql-func-offset-value-window-functions
-- @expect {"types":["Select"],"functions":["LAG","LEAD","FIRST_VALUE","LAST_VALUE"]}
SELECT LAG(a) OVER w, LAG(a, 2) OVER w, LAG(a, 2, 0) OVER w, LEAD(a, 1, a) OVER w, FIRST_VALUE(a) OVER w, LAST_VALUE(a) OVER w FROM t WINDOW w AS (ORDER BY a);

-- @case mysql-func-aggregate-over-empty-and-named
-- @expect {"types":["Select"],"functions":["SUM","COUNT","AVG"]}
SELECT SUM(a) OVER (), COUNT(*) OVER w, AVG(DISTINCT a) OVER () FROM t WINDOW w AS (PARTITION BY b);

-- @case mysql-func-group-concat-over
-- @expect {"types":["Select"],"functions":["GROUP_CONCAT"]}
SELECT GROUP_CONCAT(a) OVER () FROM t;

-- @case mysql-func-qualified-stored-function
-- @expect {"types":["Select"]}
SELECT shop.f(a) FROM t;

-- @case mysql-func-quoted-qualified-stored-function
-- @expect {"types":["Select"]}
SELECT `shop`.`f`(a) FROM t;

-- @case mysql-func-nested-calls
-- @expect {"types":["Select"],"functions":["UPPER","LOWER","CONCAT","LPAD"]}
SELECT UPPER(LOWER(CONCAT(s, LPAD(CAST(a AS CHAR), 5, '0')))) FROM t;

-- @case mysql-func-subquery-arguments
-- @expect {"types":["Select"],"functions":["COALESCE","MAX","IFNULL","GREATEST"]}
SELECT COALESCE((SELECT MAX(a) FROM t1), 0), IFNULL((SELECT 1), 2), GREATEST(a, (SELECT b FROM t2 LIMIT 1)) FROM t;

-- @case mysql-func-json-path-functions
-- @expect {"types":["Select"],"functions":["JSON_EXTRACT","JSON_SET","JSON_CONTAINS_PATH"]}
SELECT JSON_EXTRACT(j, '$.a[0]', '$.b'), JSON_SET(j, '$.c', 1), JSON_CONTAINS_PATH(j, 'one', '$.a'), j->'$.a', j->>'$[last]' FROM t;

-- @case mysql-func-json-constructors
-- @expect {"types":["Select"],"functions":["JSON_OBJECT","JSON_ARRAY"]}
SELECT JSON_OBJECT('a', 1, 'b', JSON_ARRAY(1, 2)), JSON_ARRAY() FROM t;

-- @case mysql-func-member-of-overlaps
-- @expect {"types":["Select"],"functions":["JSON_OVERLAPS"]}
SELECT 1 MEMBER OF (j), JSON_OVERLAPS(j, '[1]') FROM t;

-- @case mysql-select-all-select-options-combined
-- @expect {"types":["Select"]}
SELECT ALL HIGH_PRIORITY STRAIGHT_JOIN SQL_SMALL_RESULT SQL_BIG_RESULT SQL_BUFFER_RESULT SQL_NO_CACHE SQL_CALC_FOUND_ROWS id FROM orders;

-- @case mysql-select-options-any-order-distinctrow
-- @expect {"types":["Select"]}
SELECT SQL_CALC_FOUND_ROWS DISTINCTROW HIGH_PRIORITY id FROM orders;

-- @case mysql-select-repeated-high-priority
-- @expect {"types":["Select"]}
SELECT HIGH_PRIORITY HIGH_PRIORITY id FROM orders;

-- @case mysql-select-from-dual-with-where
-- @expect {"types":["Select"]}
SELECT 1 + 1 AS two FROM DUAL WHERE 1 = 1;

-- @case mysql-select-from-dual-order-limit
-- @expect {"types":["Select"]}
SELECT 1 FROM DUAL ORDER BY 1 LIMIT 1;

-- @case mysql-select-where-without-from
-- @expect {"types":["Select"]}
SELECT 1 WHERE 1 = 1;

-- @case mysql-select-star-then-column
-- @expect {"types":["Select"]}
SELECT *, id FROM orders;

-- @case mysql-select-qualified-star-with-alias
-- @expect {"types":["Select"],"tables":[{"name":"orders","access":"read"},{"name":"customers","access":"read"}]}
SELECT o.*, c.name FROM orders AS o, customers c;

-- @case mysql-select-alias-quote-styles
-- @expect {"types":["Select"]}
SELECT id AS 'single', total 'bare_str', status AS "dbl", note `bt`, amount bare FROM orders;

-- @case mysql-select-backtick-reserved-alias-in-order-by
-- @expect {"types":["Select"]}
SELECT id AS `select`, total AS status FROM orders ORDER BY `select`;

-- @case mysql-select-nonreserved-keyword-aliases
-- @expect {"types":["Select"]}
SELECT id AS date, total AS text FROM orders;

-- @case mysql-select-alias-in-group-having-order
-- @expect {"types":["Select"]}
SELECT customer_id AS cid, SUM(total) AS s FROM orders GROUP BY cid HAVING s > 10 ORDER BY s DESC;

-- @case mysql-select-group-by-positions
-- @expect {"types":["Select"]}
SELECT customer_id, status FROM orders GROUP BY 1, 2;

-- @case mysql-select-rollup-with-order-by
-- @expect {"types":["Select"]}
SELECT customer_id, SUM(total) FROM orders GROUP BY customer_id WITH ROLLUP ORDER BY customer_id;

-- @case mysql-select-having-without-group-by
-- @expect {"types":["Select"]}
SELECT COUNT(*) FROM orders HAVING COUNT(*) > 0;

-- @case mysql-select-order-by-null
-- @expect {"types":["Select"]}
SELECT customer_id FROM orders GROUP BY customer_id ORDER BY NULL;

-- @case mysql-select-order-by-expr-position-rand
-- @expect {"types":["Select"]}
SELECT id FROM orders ORDER BY total * 2 DESC, 1, RAND();

-- @case mysql-select-limit-zero
-- @expect {"types":["Select"]}
SELECT id FROM orders LIMIT 0;

-- @case mysql-select-limit-two-params-comma
-- @expect {"types":["Select"]}
SELECT id FROM orders LIMIT ?, ?;

-- @case mysql-select-limit-params-offset
-- @expect {"types":["Select"]}
SELECT id FROM orders LIMIT ? OFFSET ?;

-- @case mysql-select-window-inheritance
-- @expect {"types":["Select"]}
SELECT SUM(total) OVER w2, AVG(total) OVER w1 FROM orders WINDOW w1 AS (PARTITION BY customer_id), w2 AS (w1 ORDER BY created_at);

-- @case mysql-select-empty-named-window
-- @expect {"types":["Select"]}
SELECT SUM(total) OVER w FROM orders WINDOW w AS ();

-- @case mysql-select-range-interval-bounds
-- @expect {"types":["Select"]}
SELECT SUM(total) OVER (ORDER BY created_at RANGE BETWEEN INTERVAL 1 DAY PRECEDING AND INTERVAL 1 DAY FOLLOWING) FROM orders;

-- @case mysql-select-rows-single-bound-forms
-- @expect {"types":["Select"]}
SELECT SUM(total) OVER (ORDER BY id ROWS 2 PRECEDING), SUM(total) OVER (ORDER BY id ROWS UNBOUNDED PRECEDING), SUM(total) OVER (ORDER BY id ROWS CURRENT ROW) FR;

-- @case mysql-select-range-current-to-unbounded-following
-- @expect {"types":["Select"]}
SELECT SUM(total) OVER (ORDER BY id RANGE BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING) FROM orders;

-- @case mysql-select-cross-join-with-on
-- @expect {"types":["Select"],"tables":[{"name":"t1","access":"read"},{"name":"t2","access":"read"}]}
SELECT * FROM t1 CROSS JOIN t2 ON t1.id = t2.id;

-- @case mysql-select-join-without-on-then-inner-join
-- @expect {"types":["Select"],"tables":[{"name":"t1","access":"read"},{"name":"t2","access":"read"},{"name":"t3","access":"read"}]}
SELECT * FROM t1 JOIN t2 INNER JOIN t3 ON t1.id = t3.id;

-- @case mysql-select-natural-left-outer-and-right
-- @expect {"types":["Select"],"tables":[{"name":"t1","access":"read"},{"name":"t2","access":"read"},{"name":"t3","access":"read"}]}
SELECT * FROM t1 NATURAL LEFT OUTER JOIN t2 NATURAL RIGHT JOIN t3;

-- @case mysql-select-straight-join-without-on
-- @expect {"types":["Select"],"tables":[{"name":"t1","access":"read"},{"name":"t2","access":"read"}]}
SELECT * FROM t1 STRAIGHT_JOIN t2;

-- @case mysql-select-join-using-multiple-columns
-- @expect {"types":["Select"],"tables":[{"name":"t1","access":"read"},{"name":"t2","access":"read"}]}
SELECT * FROM t1 JOIN t2 USING (a, b);

-- @case mysql-select-nested-join-parenthesized-right
-- @expect {"types":["Select"],"tables":[{"name":"t1","access":"read"},{"name":"t2","access":"read"},{"name":"t3","access":"read"}]}
SELECT * FROM t1 JOIN (t2 JOIN t3 ON t2.id = t3.id) ON t1.id = t2.id;

-- @case mysql-select-parenthesized-comma-list-join
-- @expect {"types":["Select"],"tables":[{"name":"t1","access":"read"},{"name":"t2","access":"read"},{"name":"t3","access":"read"}]}
SELECT * FROM (t1, t2) JOIN t3 ON t1.id = t3.id;

-- @case mysql-select-comma-lower-precedence-than-join
-- @expect {"types":["Select"],"tables":[{"name":"t1","access":"read"},{"name":"t2","access":"read"},{"name":"t3","access":"read"}]}
SELECT * FROM t1, t2 JOIN t3 ON t1.id = t3.id;

-- @case mysql-select-double-parenthesized-table
-- @expect {"types":["Select"],"tables":[{"name":"t1","access":"read"}]}
SELECT * FROM ((t1));

-- @case mysql-select-double-parenthesized-aliased-table
-- @expect {"types":["Select"],"tables":[{"name":"t1","access":"read"}]}
SELECT * FROM ((t1 AS x));

-- @case mysql-select-db-qualified-backtick-reserved-aliases
-- @expect {"types":["Select"],"tables":[{"db":"shop","name":"t1","access":"read"},{"db":"shop","name":"t2","access":"read"}]}
SELECT * FROM shop.t1 AS `order` JOIN shop.t2 `key` ON `order`.id = `key`.id;

-- @case mysql-select-partition-before-alias
-- @expect {"types":["Select"],"tables":[{"name":"orders","access":"read"}]}
SELECT * FROM orders PARTITION (p0, p1) AS o WHERE o.id = 1;

-- @case mysql-select-repeated-use-index-for-join
-- @expect {"types":["Select"]}
SELECT * FROM orders USE INDEX FOR JOIN (idx_customer) USE INDEX FOR JOIN (idx_status);

-- @case mysql-select-for-update-of-multiple-nowait
-- @expect {"types":["Select"],"tables":[{"name":"orders","access":"read"},{"name":"customers","access":"read"}]}
SELECT * FROM orders o JOIN customers c ON o.customer_id = c.id FOR UPDATE OF o, c NOWAIT;

-- @case mysql-select-multiple-locking-clauses
-- @expect {"types":["Select"],"tables":[{"name":"orders","access":"read"},{"name":"customers","access":"read"}]}
SELECT * FROM orders o JOIN customers c ON o.customer_id = c.id FOR SHARE OF o FOR UPDATE OF c SKIP LOCKED;

-- @case mysql-select-limit-then-for-update
-- @expect {"types":["Select"]}
SELECT * FROM orders LIMIT 1 FOR UPDATE;

-- @case mysql-select-empty-use-index-with-ignore-for-group-by
-- @expect {"types":["Select"]}
SELECT * FROM orders USE INDEX () IGNORE KEY FOR GROUP BY (idx_status, PRIMARY);

-- @case mysql-select-force-key-for-order-by-primary
-- @expect {"types":["Select"]}
SELECT * FROM orders o FORCE KEY FOR ORDER BY (PRIMARY) IGNORE INDEX (idx_status);

-- @case mysql-select-join-without-on
-- @expect {"types":["Select"],"tables":[{"name":"t1","access":"read"},{"name":"t2","access":"read"}]}
SELECT * FROM t1 JOIN t2;

-- @case mysql-select-right-outer-join-using
-- @expect {"types":["Select"],"tables":[{"name":"t1","access":"read"},{"name":"t2","access":"read"}]}
SELECT * FROM t1 RIGHT OUTER JOIN t2 USING (id);

-- @case mysql-select-straight-join-using
-- @expect {"types":["Select"],"tables":[{"name":"t1","access":"read"},{"name":"t2","access":"read"}]}
SELECT * FROM t1 STRAIGHT_JOIN t2 USING (id);

-- @case mysql-query-derived-without-as
-- @expect {"types":["Select"],"tables":[{"name":"orders","access":"read"}]}
SELECT * FROM (SELECT id FROM orders) o;

-- @case mysql-query-derived-column-list
-- @expect {"types":["Select"],"tables":[]}
SELECT * FROM (SELECT 1, 2) AS d (a, b);

-- @case mysql-query-lateral-comma-correlation
-- @expect {"types":["Select"],"tables":[{"name":"t1","access":"read"}]}
SELECT * FROM t1, LATERAL (SELECT t1.a AS x) d WHERE d.x > 0;

-- @case mysql-query-double-parenthesized-derived-with-tail
-- @expect {"types":["Select"],"tables":[{"name":"orders","access":"read"}]}
SELECT * FROM ((SELECT id FROM orders ORDER BY id LIMIT 3)) AS d;

-- @case mysql-query-nested-derived-three-levels
-- @expect {"types":["Select"],"tables":[{"name":"t1","access":"read"}]}
SELECT * FROM (SELECT * FROM (SELECT * FROM (SELECT id FROM t1) a) b) c;

-- @case mysql-query-derived-own-order-limit
-- @expect {"types":["Select"]}
SELECT * FROM (SELECT id FROM orders ORDER BY id DESC LIMIT 5) AS recent;

-- @case mysql-query-derived-union
-- @expect {"types":["Select"],"tables":[{"name":"t1","access":"read"},{"name":"t2","access":"read"}]}
SELECT * FROM (SELECT a FROM t1 UNION SELECT a FROM t2) AS u;

-- @case mysql-query-scalar-subquery-select-list
-- @expect {"types":["Select"],"tables":[{"name":"customers","access":"read"},{"name":"orders","access":"read"}]}
SELECT id, (SELECT name FROM customers c WHERE c.id = o.customer_id) AS cname FROM orders o;

-- @case mysql-query-scalar-subquery-where-comparison
-- @expect {"types":["Select"]}
SELECT * FROM orders WHERE total > (SELECT AVG(total) FROM orders);

-- @case mysql-query-not-in-subquery
-- @expect {"types":["Select"]}
SELECT * FROM orders WHERE customer_id NOT IN (SELECT id FROM customers WHERE region_id IS NULL);

-- @case mysql-query-all-quantifier
-- @expect {"types":["Select"]}
SELECT * FROM orders WHERE total >= ALL (SELECT amount FROM payments);

-- @case mysql-query-some-quantifier
-- @expect {"types":["Select"]}
SELECT * FROM orders WHERE total = SOME (SELECT amount FROM payments);

-- @case mysql-query-any-not-equal
-- @expect {"types":["Select"]}
SELECT * FROM orders WHERE total <> ANY (SELECT amount FROM payments);

-- @case mysql-query-row-subquery-comparison
-- @expect {"types":["Select"]}
SELECT * FROM t1 WHERE (a, b) = (SELECT a, b FROM t2 LIMIT 1);

-- @case mysql-query-row-keyword-in-subquery
-- @expect {"types":["Select"]}
SELECT * FROM t1 WHERE ROW(a, b) IN (SELECT a, b FROM t2);

-- @case mysql-query-subquery-in-order-by
-- @expect {"types":["Select"]}
SELECT * FROM t1 ORDER BY (SELECT MAX(a) FROM t2);

-- @case mysql-query-subquery-in-having
-- @expect {"types":["Select"]}
SELECT a FROM t1 GROUP BY a HAVING COUNT(*) > (SELECT COUNT(*) FROM t2);

-- @case mysql-query-subquery-function-argument
-- @expect {"types":["Select"],"tables":[{"name":"t2","access":"read"},{"name":"t1","access":"read"}]}
SELECT COALESCE((SELECT MAX(a) FROM t2), 0) FROM t1;

-- @case mysql-query-subquery-in-case
-- @expect {"types":["Select"]}
SELECT CASE WHEN EXISTS (SELECT 1 FROM t2) THEN 1 ELSE (SELECT 2) END;

-- @case mysql-query-in-subquery-union
-- @expect {"types":["Select"],"tables":[{"name":"t1","access":"read"}]}
SELECT * FROM t1 WHERE a IN (SELECT 1 UNION SELECT 2);

-- @case mysql-query-doubly-parenthesized-scalar-subquery
-- @expect {"types":["Select"]}
SELECT ((SELECT 1));

-- @case mysql-query-in-double-parenthesized-subquery
-- @expect {"types":["Select"],"tables":[{"name":"t1","access":"read"},{"name":"t2","access":"read"}]}
SELECT * FROM t1 WHERE a IN ((SELECT a FROM t2));

-- @case mysql-query-not-exists-with-limit
-- @expect {"types":["Select"]}
SELECT * FROM t1 WHERE NOT EXISTS (SELECT * FROM t2 WHERE t2.a = t1.a LIMIT 1);

-- @case mysql-query-scalar-subquery-own-limit
-- @expect {"types":["Select"]}
SELECT * FROM t1 WHERE a = (SELECT a FROM t2 ORDER BY a LIMIT 1);

-- @case mysql-query-cte-references-earlier-cte
-- @expect {"types":["Select"],"tables":[]}
WITH a AS (SELECT 1 AS x), b AS (SELECT x + 1 AS y FROM a) SELECT * FROM a, b;

-- @case mysql-query-cte-column-list
-- @expect {"types":["Select"]}
WITH c (x, y) AS (SELECT 1, 2) SELECT x, y FROM c;

-- @case mysql-query-recursive-union-distinct
-- @expect {"types":["Select"],"tables":[]}
WITH RECURSIVE r (n) AS (SELECT 1 UNION DISTINCT SELECT n + 1 FROM r WHERE n < 5) SELECT n FROM r;

-- @case mysql-query-recursive-with-limit
-- @expect {"types":["Select"],"tables":[]}
WITH RECURSIVE r (n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM r LIMIT 10) SELECT n FROM r;

-- @case mysql-query-cte-used-twice
-- @expect {"types":["Select"],"tables":[{"name":"orders","access":"read"}]}
WITH c AS (SELECT id FROM orders) SELECT * FROM c x JOIN c y ON x.id = y.id;

-- @case mysql-query-with-inside-in-subquery
-- @expect {"types":["Select"],"tables":[{"name":"t1","access":"read"},{"name":"t2","access":"read"}]}
SELECT * FROM t1 WHERE a IN (WITH c AS (SELECT a FROM t2) SELECT a FROM c);

-- @case mysql-query-with-inside-scalar-subquery
-- @expect {"types":["Select"],"tables":[]}
SELECT (WITH c AS (SELECT 1 AS v) SELECT v FROM c) AS s;

-- @case mysql-query-cte-shadows-real-table
-- @expect {"types":["Select"],"tables":[]}
WITH orders AS (SELECT 1 AS id) SELECT * FROM orders;

-- @case mysql-query-cte-backtick-keyword-name
-- @expect {"types":["Select"],"tables":[]}
WITH `select` AS (SELECT 1 AS v) SELECT v FROM `select`;

-- @case mysql-query-cte-with-derived-and-exists
-- @expect {"types":["Select"],"tables":[{"name":"orders","access":"read"},{"name":"t1","access":"read"}]}
WITH c AS (SELECT 1 AS v) SELECT * FROM c, (SELECT * FROM orders) c2 WHERE EXISTS (SELECT 1 FROM t1);

-- @case mysql-query-derived-cte-shadow-not-leaking
-- @expect {"types":["Select"],"tables":[{"name":"t1","access":"read"}]}
SELECT * FROM (WITH t1 AS (SELECT 1 AS a) SELECT a FROM t1) d, t1;

-- @case mysql-query-cte-referenced-in-subquery
-- @expect {"types":["Select"],"tables":[{"name":"t1","access":"read"}]}
WITH c AS (SELECT * FROM t1) SELECT * FROM c WHERE a IN (SELECT a FROM c);

-- @case mysql-query-mixed-set-operation-chain
-- @expect {"types":["SetOp"],"tables":[]}
SELECT 1 UNION SELECT 2 UNION ALL SELECT 3 EXCEPT SELECT 4 INTERSECT SELECT 5;

-- @case mysql-query-except-all
-- @expect {"types":["SetOp"]}
SELECT a FROM t1 EXCEPT ALL SELECT a FROM t2;

-- @case mysql-query-intersect-distinct
-- @expect {"types":["SetOp"]}
SELECT a FROM t1 INTERSECT DISTINCT SELECT a FROM t2;

-- @case mysql-query-intersect-all
-- @expect {"types":["SetOp"]}
SELECT a FROM t1 INTERSECT ALL SELECT a FROM t2;

-- @case mysql-query-except-distinct
-- @expect {"types":["SetOp"]}
SELECT a FROM t1 EXCEPT DISTINCT SELECT a FROM t2;

-- @case mysql-query-parenthesized-right-operand
-- @expect {"types":["SetOp"],"tables":[]}
SELECT 1 UNION (SELECT 2 UNION SELECT 3);

-- @case mysql-query-operand-tails-and-outer-tail
-- @expect {"types":["SetOp"],"tables":[{"name":"t1","access":"read"},{"name":"t2","access":"read"}]}
(SELECT a FROM t1 ORDER BY a LIMIT 1) UNION ALL (SELECT a FROM t2 ORDER BY a DESC LIMIT 1) ORDER BY 1 LIMIT 2;

-- @case mysql-query-nested-query-group-limit
-- @expect {"types":["QueryGroup"],"tables":[]}
((SELECT 1) UNION (SELECT 2)) LIMIT 1;

-- @case mysql-query-parenthesized-statement-order-by
-- @expect {"types":["QueryGroup"]}
((SELECT 1) ORDER BY 1);

-- @case mysql-query-triple-parenthesized-select
-- @expect {"types":["QueryGroup"],"tables":[{"name":"t1","access":"read"}]}
(((SELECT a FROM t1)));

-- @case mysql-query-set-operation-inside-cte
-- @expect {"types":["Select"],"tables":[{"name":"t1","access":"read"},{"name":"t2","access":"read"}]}
WITH u AS (SELECT a FROM t1 UNION SELECT a FROM t2) SELECT * FROM u;

-- @case mysql-query-intersect-precedence-with-tail
-- @expect {"types":["SetOp"]}
SELECT 1 INTERSECT SELECT 2 UNION SELECT 3 ORDER BY 1 LIMIT 1;

-- @case mysql-query-locking-in-parenthesized-operand
-- @expect {"types":["SetOp"],"tables":[{"name":"t1","access":"read"},{"name":"t2","access":"read"}]}
(SELECT a FROM t1 FOR UPDATE) UNION (SELECT a FROM t2);

-- @case mysql-query-derived-with-for-share
-- @expect {"types":["Select"],"tables":[{"name":"t1","access":"read"}]}
SELECT * FROM (SELECT a FROM t1) AS d FOR SHARE;

-- @case mysql-query-leading-lateral-derived
-- @expect {"types":["Select"],"tables":[]}
SELECT * FROM LATERAL (SELECT 1) d;

-- @case mysql-nearmiss-having-without-group-by
-- @expect {"types":["Select"]}
SELECT a FROM t HAVING a > 1;

-- @case mysql-nearmiss-window-before-order-by
-- @expect {"types":["Select"]}
SELECT a, ROW_NUMBER() OVER w FROM t WINDOW w AS () ORDER BY a;

-- @case mysql-nearmiss-reserved-word-after-dot
-- @expect {"types":["Select"]}
SELECT t.from FROM t;

-- @case mysql-nearmiss-where-not-null
-- @expect {"types":["Select"]}
SELECT * FROM t WHERE NOT NULL;

-- @case mysql-nearmiss-any-subquery
-- @expect {"types":["Select"]}
SELECT * FROM t WHERE a = ANY (SELECT 1);

-- @case mysql-nearmiss-cross-join-using
-- @expect {"types":["Select"]}
SELECT * FROM t1 CROSS JOIN t2 USING (a);

-- @case mysql-nearmiss-group-by-with-rollup
-- @expect {"types":["Select"]}
SELECT a FROM t GROUP BY a WITH ROLLUP;

-- @case mysql-nearmiss-dollar-identifier
-- @expect {"types":["Select"]}
SELECT $1;

-- @case mysql-nearmiss-double-quoted-string
-- @expect {"types":["Select"]}
SELECT "double" FROM t;

-- @case mysql-nearmiss-inner-join-without-on
-- @expect {"types":["Select"]}
SELECT * FROM t1 INNER JOIN t2;

-- @case mysql-reserved-quoted-or-qualified-names
-- @expect {"types":["Select"],"tables":[{"name":"t","access":"read"}]}
SELECT `rank`, t.select, t.`order`, t .from FROM t;

-- @case mysql-reserved-keyword-functions-with-fixed-arity
-- @expect {"types":["Select"],"functions":["IF","LEFT","RIGHT","MOD","REPEAT","REPLACE","INSERT","CHAR","DATABASE","SCHEMA","CURRENT_USER"]}
SELECT IF(a, 1, 2), LEFT(s, 1), RIGHT(s, 1), MOD(a, 2), REPEAT(s, 2), REPLACE(s, 'a', 'b'),
       INSERT(s, 1, 1, 'x'), CHAR(65, 66), DATABASE(), SCHEMA(), CURRENT_USER() FROM t;

-- @case mysql-reserved-niladic-functions-with-precision
-- @expect {"types":["Select"],"functions":["CURRENT_TIMESTAMP","CURRENT_TIME","LOCALTIME","UTC_TIMESTAMP","CURRENT_DATE"]}
SELECT CURRENT_TIMESTAMP(6), CURRENT_TIME(3), LOCALTIME(), UTC_TIMESTAMP, CURRENT_DATE;

-- @case mysql-reserved-window-functions-and-constant-arguments
-- @expect {"types":["Select"],"functions":["ROW_NUMBER","RANK","NTILE","LAG","LEAD","NTH_VALUE","FIRST_VALUE"]}
SELECT ROW_NUMBER() OVER w, RANK() OVER w, NTILE(?) OVER w, LAG(a, 2, 0) OVER w,
       LEAD(a, ?) OVER w, NTH_VALUE(a, 2) OVER w, FIRST_VALUE(a) OVER w
FROM t WINDOW w AS (ORDER BY a);

-- @case mysql-values-and-default-take-a-column
-- @expect {"types":["Select"],"functions":["VALUES","DEFAULT"]}
SELECT VALUES(a), DEFAULT(a) FROM t;

-- @case mysql-aggregates-over-window
-- @expect {"types":["Select"],"functions":["SUM","JSON_ARRAYAGG","BIT_AND","VARIANCE"]}
SELECT SUM(a) OVER (), JSON_ARRAYAGG(a) OVER (), BIT_AND(a) OVER (), VARIANCE(a) OVER () FROM t;

-- @case mysql-aggregate-argument-forms
-- @expect {"types":["Select"],"functions":["COUNT","SUM","AVG","MIN","VARIANCE","JSON_OBJECTAGG","GROUP_CONCAT"]}
SELECT COUNT(*), COUNT(ALL a), COUNT(DISTINCT a, b), SUM(DISTINCT a), AVG(ALL a), MIN(DISTINCT a),
       VARIANCE(ALL a), JSON_OBJECTAGG(a, b), GROUP_CONCAT(DISTINCT a, b ORDER BY a SEPARATOR ',') FROM t;

-- @case mysql-interval-operand-positions
-- @expect {"types":["Select"],"functions":["DATE_ADD","DATE_SUB","ADDDATE","SUBDATE"]}
SELECT dt + INTERVAL 1 DAY, INTERVAL 1 DAY + dt, dt - INTERVAL 1 DAY, 1 + INTERVAL 1 DAY + dt,
       dt + INTERVAL 1 DAY + INTERVAL 2 HOUR, DATE_ADD(dt, INTERVAL 1 DAY), DATE_SUB(dt, INTERVAL 1 DAY),
       ADDDATE(dt, 5), SUBDATE(dt, INTERVAL 1 DAY) FROM t;

-- @case mysql-cast-target-types
-- @expect {"types":["Select"]}
SELECT CAST(a AS SIGNED INT), CAST(a AS UNSIGNED INTEGER), CAST(a AS BINARY(4)), CAST(a AS CHAR(10) CHARSET latin1),
       CAST(a AS CHAR BYTE), CAST(a AS NCHAR(3)), CAST(a AS DEC(5, 2)), CAST(a AS DOUBLE PRECISION), CAST(a AS FLOAT(10)),
       CAST(a AS DATETIME(6)), CAST(a AS YEAR), CAST(a AS REAL), CAST(a AS POINT), CONVERT(a, DECIMAL(10, 2)) FROM t;

-- @case mysql-cast-to-array-type
-- @expect {"types":["Select"]}
SELECT CAST(j->'$.a' AS UNSIGNED ARRAY), CAST(j->'$.b' AS CHAR(10) ARRAY) FROM t;

-- @case mysql-predicates-compare-but-do-not-chain
-- @expect {"types":["Select"]}
SELECT a LIKE b = c, a = b LIKE c, a IN (1) = 1, a BETWEEN 1 AND 2 BETWEEN 0 AND 1, a LIKE b IS NULL,
       (a LIKE b) LIKE c, a IS NULL IS NULL, a IS NULL = 1, a = 1 IS TRUE, NOT a IS TRUE FROM t;

-- @case mysql-like-simple-pattern-and-escape
-- @expect {"types":["Select"],"functions":["CONCAT"]}
SELECT a LIKE -b, a LIKE b COLLATE utf8mb4_bin, a LIKE j->'$', a LIKE (b + 1), a LIKE 'x' ESCAPE CONCAT('!'),
       a REGEXP b + 1 FROM t;

-- @case mysql-json-arrow-on-column-references
-- @expect {"types":["Select"]}
SELECT j->'$', t.j->'$', `j`->'$', j->>'$', j -> '$', j->"$" FROM t;

-- @case mysql-quantified-comparison-subqueries
-- @expect {"types":["Select"]}
SELECT a = ANY ((SELECT 1)), a = SOME (SELECT 1 UNION SELECT 2), a > ALL (SELECT 1) FROM t;

-- @case mysql-star-first-then-columns
-- @expect {"types":["Select"],"tables":[{"name":"orders","access":"read"}]}
SELECT *, id, orders.* FROM orders;

-- @case mysql-from-dual-with-clauses
-- @expect {"types":["Select","Select"],"tables":[]}
SELECT 1 FROM DUAL WHERE 1 ORDER BY 1;
SELECT 1 FROM dual FOR UPDATE;

-- @case mysql-outer-join-using-and-straight-join-using
-- @expect {"types":["Select"],"tables":[{"name":"t1","access":"read"},{"name":"t2","access":"read"},{"name":"t3","access":"read"}]}
SELECT * FROM t1 LEFT JOIN t2 USING (id) CROSS JOIN t3 USING (id) STRAIGHT_JOIN t1 AS again USING (id);

-- @case mysql-limit-integer-and-placeholder
-- @expect {"types":["Select","Select"]}
SELECT 1 LIMIT 18446744073709551615;
SELECT 1 LIMIT ?, 1;

-- @case mysql-derived-table-aliases
-- @expect {"types":["Select"],"tables":[]}
SELECT * FROM (SELECT 1) AS d, ((SELECT 1)) e, LATERAL (SELECT 1) AS f (x);

-- @case mysql-index-hints-use-with-ignore
-- @expect {"types":["Select","Select"],"tables":[{"name":"orders","access":"read"},{"name":"orders","access":"read"}]}
SELECT * FROM orders USE INDEX (PRIMARY) IGNORE INDEX (idx_status);
SELECT * FROM orders FORCE INDEX (PRIMARY) IGNORE INDEX FOR ORDER BY (idx_created);

-- @case mysql-hex-and-bit-literal-lengths
-- @expect {"types":["Select"]}
SELECT X'', b'', 0x0, 0xabc, 0b10, X'0a0B';

-- @case mysql-window-offset-user-variable
-- @expect {"types":["Select"],"functions":["LAG","NTILE"]}
SELECT LAG(a, @n) OVER (), NTILE(@n) OVER () FROM t;

-- @case mysql-quoted-function-name-is-stored-function
-- @expect {"types":["Select"],"functions":["COUNT","DATE_ADD"]}
SELECT `count`(1, 2), `date_add`(dt, 5) FROM t;

-- @case mysql-quoted-dual-is-a-table
-- @expect {"types":["Select"],"tables":[{"name":"t","access":"read"},{"name":"dual","access":"read"}]}
SELECT a FROM t, `dual`;

-- @case mysql-space-sensitive-builtin-as-ordinary-call
-- @expect {"types":["Select"],"functions":["COUNT"]}
SELECT COUNT (1, 2);

-- @case mysql-stored-functions-named-like-special-builtins
-- @expect {"types":["Select"],"functions":["POSITION","shop.POSITION","EXTRACT","TRIM"]}
SELECT `position`(1, 2), shop.position(1, 2), `extract`(a, b), `trim`(s) FROM t;
