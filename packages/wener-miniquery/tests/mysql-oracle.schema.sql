-- Schema for the MySQL oracle (tests/mysqlOracle.ts). Names match the fixtures so that name
-- resolution passes; unknown tables and columns are still reported as "syntax accepted".
CREATE DATABASE IF NOT EXISTS shop;
USE shop;
CREATE TABLE orders (
  id INT PRIMARY KEY, customer_id INT, total DECIMAL(10, 2), status VARCHAR(20), note TEXT, created_at DATETIME,
  payload JSON, amount DECIMAL(10, 2),
  KEY idx_customer (customer_id), KEY idx_status (status), KEY idx_created (created_at)
) PARTITION BY HASH(id) PARTITIONS 2;
CREATE TABLE customers (id INT PRIMARY KEY, customer_id INT, name VARCHAR(50), region_id INT, email VARCHAR(100));
CREATE TABLE payments (id INT PRIMARY KEY, order_id INT, amount DECIMAL(10, 2), created_at DATETIME);
CREATE TABLE regions (id INT PRIMARY KEY, region_id INT, name VARCHAR(50));
CREATE TABLE events (id INT PRIMARY KEY, payload JSON, label VARCHAR(50), created_at DATETIME, deleted_at DATETIME, active BOOL);
CREATE TABLE articles (id INT PRIMARY KEY, title VARCHAR(200), body TEXT, FULLTEXT KEY ft_title_body (title, body), FULLTEXT KEY ft_body (body));
CREATE TABLE t (id INT PRIMARY KEY, a INT, b INT, c INT, d INT, x INT, y INT, name VARCHAR(50), s VARCHAR(50), j JSON, dt DATETIME);
CREATE TABLE t1 (id INT PRIMARY KEY, a INT, b INT, x INT);
CREATE TABLE t2 (id INT PRIMARY KEY, a INT, b INT, x INT);
CREATE TABLE t3 (id INT PRIMARY KEY, a INT, b INT, x INT);
CREATE TABLE archived_orders LIKE customers;
