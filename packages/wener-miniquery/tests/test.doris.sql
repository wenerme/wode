-- @case doris-lateral-view-and-outer-expansion
-- @mysql-reject
-- @expect {"types":["Select","Select"],"tables":[{"name":"events","access":"read"},{"name":"events","access":"read"}],"functions":["EXPLODE","EXPLODE"],"risks":[]}
SELECT * FROM events LATERAL VIEW EXPLODE(tags) expanded AS tag WHERE id = 1;
SELECT * FROM events LATERAL VIEW OUTER EXPLODE(tags) expanded AS tag;

-- @case doris-catalog-partitions-tablets-and-shuffle-semi-join
-- @mysql-reject
-- @expect {"types":["Select"],"tables":[{"catalog":"warehouse","db":"shop","name":"orders","access":"read"},{"name":"customers","access":"read"}],"risks":[]}
SELECT o.*
FROM warehouse.shop.orders PARTITION (p2024, p2025) TABLET (1001, 1002) o
LEFT SEMI JOIN [shuffle] customers c ON o.customer_id = c.id;

-- @case doris-temporary-partition-anti-and-full-joins
-- @mysql-reject
-- @expect {"types":["Select"],"tables":[{"name":"orders","access":"read"},{"name":"refunds","access":"read"},{"name":"customers","access":"read"}],"risks":[]}
SELECT *
FROM orders TEMPORARY PARTITION (tp1)
RIGHT ANTI JOIN refunds ON orders.id = refunds.order_id
FULL OUTER JOIN customers ON customers.id = orders.customer_id;

-- @case doris-right-semi-left-anti-and-broadcast-join
-- @mysql-reject
-- @expect {"types":["Select"],"tables":[{"name":"orders","access":"read"},{"name":"customers","access":"read"},{"name":"blocked_customers","access":"read"}],"risks":[]}
SELECT customers.id
FROM orders RIGHT SEMI JOIN [broadcast] customers ON orders.customer_id = customers.id
LEFT ANTI JOIN blocked_customers blocked ON customers.id = blocked.id;

-- @case doris-insert-overwrite-partition-and-label
-- @mysql-reject
-- @expect {"types":["Insert"],"tables":[{"name":"order_snapshot","access":"write"},{"name":"orders","access":"read"}],"risks":[]}
INSERT OVERWRITE TABLE order_snapshot PARTITION (p2024) WITH LABEL daily_orders
SELECT * FROM orders;

-- @case doris-array-lambdas-and-subscripts
-- @mysql-reject
-- @expect {"types":["Select"],"tables":[{"name":"events","access":"read"}],"functions":["ARRAY_MAP","ARRAY_FILTER"],"risks":[]}
SELECT ARRAY_MAP(x -> x + 1, [1, 2, 3]),
       ARRAY_FILTER((x, y) -> x > y, scores, thresholds),
       attributes['region'], tags[1]
FROM events;

-- @case doris-minus-set-operation
-- @mysql-reject
-- @expect {"types":["SetOp"],"tables":[{"name":"orders","access":"read"},{"name":"cancelled_orders","access":"read"}],"risks":[]}
SELECT id FROM orders MINUS SELECT id FROM cancelled_orders;

-- @case doris-grouping-sets-and-explicit-null-order
-- @mysql-reject
-- @expect {"types":["Select"],"tables":[{"name":"orders","access":"read"}],"functions":["SUM"],"risks":[]}
SELECT customer_id, region_id, SUM(total)
FROM orders
GROUP BY GROUPING SETS ((customer_id, region_id), (customer_id), ())
ORDER BY customer_id NULLS LAST, region_id DESC NULLS FIRST;

-- @case doris-rollup-grouping
-- @expect {"types":["Select"],"tables":[{"name":"orders","access":"read"}],"functions":["SUM","ROLLUP"],"risks":[]}
SELECT customer_id, region_id, SUM(total)
FROM orders GROUP BY ROLLUP(customer_id, region_id);

-- @case doris-table-valued-function
-- @mysql-reject
-- @expect {"types":["Select"],"tables":[],"functions":["NUMBERS"],"risks":[]}
SELECT * FROM NUMBERS('number' = '10') AS generated;

-- @case doris-update-from-and-partition-delete-using
-- @mysql-reject
-- @expect {"types":["Update","Delete"],"tables":[{"name":"inventory","access":"write"},{"name":"deliveries","access":"read"},{"name":"orders","access":"write"},{"name":"cancelled_orders","access":"read"}],"risks":[]}
UPDATE inventory SET quantity = deliveries.quantity FROM deliveries
WHERE inventory.sku = deliveries.sku;
DELETE FROM orders PARTITION p2024 USING cancelled_orders
WHERE orders.id = cancelled_orders.id;

-- @case doris-outfile-format-and-properties
-- @mysql-reject
-- @expect {"types":["Select"],"tables":[{"name":"orders","access":"read"}],"risks":["into-file"]}
SELECT id FROM orders INTO OUTFILE 's3://reports/orders/' FORMAT AS CSV
PROPERTIES ('s3.endpoint' = 'https://storage.example.com');

-- @case doris-explain-verbose-and-shape
-- @mysql-reject
-- @expect {"types":["Explain","Explain"],"tables":[{"name":"orders","access":"read"}],"risks":[]}
EXPLAIN VERBOSE SELECT 1;
EXPLAIN SHAPE SELECT id FROM orders;

-- @case doris-catalog-qualified-column-star-and-use
-- @mysql-reject
-- @expect {"types":["Select","Use"],"tables":[{"catalog":"warehouse","db":"shop","name":"orders","access":"read"}],"risks":[]}
SELECT warehouse.shop.orders.id, warehouse.shop.orders.* FROM warehouse.shop.orders;
USE warehouse.shop;

-- @case doris-create-distribution-and-properties
-- @mysql-reject
-- @expect {"types":["Create"],"tables":[{"name":"orders","access":"write"}],"risks":["ddl"]}
CREATE TABLE orders (id INT)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES ('replication_num' = '1');

-- @case doris-alter-distribution-and-properties
-- @mysql-reject
-- @expect {"types":["AlterTable","AlterTable"],"tables":[{"name":"orders","access":"write"},{"name":"orders","access":"write"}],"risks":["ddl","ddl"]}
ALTER TABLE orders DISTRIBUTED BY HASH(id) BUCKETS 3;
ALTER TABLE orders PROPERTIES ('replication_num' = '1');

-- @case doris-hints-and-cte-qualified-insert-dependencies
-- @mysql-reject
-- @expect {"types":["Insert"],"tables":[{"catalog":"warehouse","db":"reports","name":"order_ids","access":"write"},{"catalog":"warehouse","db":"shop","name":"orders","access":"read"}],"functions":[],"risks":[],"comments":["hint"]}
INSERT INTO warehouse.reports.order_ids
WITH recent AS (
  SELECT /*+ SET_VAR(query_timeout = 10) */ id FROM warehouse.shop.orders
  WHERE created_at >= DATE '2024-01-01'
)
SELECT id FROM recent;

-- @case doris-empty-arrays-nested-subscripts-and-generic-cast
-- @mysql-reject
-- @expect {"types":["Select"],"tables":[{"name":"events","access":"read"}],"functions":[],"risks":[]}
SELECT [], CAST([1, 2] AS ARRAY<BIGINT>), attributes['scores'][1]
FROM events;

-- @case doris-invalid-empty-grouping-sets-clause
-- @error
SELECT customer_id FROM orders GROUP BY GROUPING SETS ();

-- @case doris-invalid-lambda-without-body
-- @error
SELECT ARRAY_MAP(x ->, [1, 2]);

-- @case doris-invalid-unclosed-array
-- @error
SELECT [1, 2;

-- @case doris-invalid-empty-subscript
-- @error
SELECT tags[] FROM events;

-- @case doris-invalid-tablet-id
-- @error
SELECT * FROM orders TABLET ('not-a-tablet');

-- @case doris-invalid-insert-label-without-query-or-values
-- @error
INSERT OVERWRITE TABLE order_snapshot WITH LABEL daily_orders;

-- @case doris-qualify-clause
-- @mysql-reject
-- @expect {"types":["Select"],"tables":[{"name":"orders","access":"read"}],"functions":["ROW_NUMBER"],"risks":[]}
SELECT ROW_NUMBER() OVER (ORDER BY id) AS position FROM orders QUALIFY position = 1;

-- @case doris-invalid-explain-format
-- @error
EXPLAIN FORMAT=BOGUS SELECT 1;

-- @case doris-qualify-window-filter-order-limit
-- @mysql-reject
-- @expect {"types":["Select"],"tables":[{"name":"orders","access":"read"}],"functions":["ROW_NUMBER"],"risks":[]}
SELECT customer_id, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at DESC) AS rn
FROM orders WHERE total > 0 QUALIFY rn = 1 ORDER BY customer_id LIMIT 10;

-- @case doris-mixed-set-precedence
-- @expect {"types":["SetOp"],"tables":[],"risks":[]}
SELECT 1 UNION SELECT 2 INTERSECT SELECT 3 EXCEPT SELECT 4;

-- @case doris-invalid-qualify-without-predicate
-- @error
SELECT id FROM orders QUALIFY;

-- @case doris-invalid-qualify-after-order
-- @error
SELECT id FROM orders ORDER BY id QUALIFY id = 1;
