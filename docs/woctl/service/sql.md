# SQL

SQL 服务提供只读查询、显式确认执行和表结构发现。Native 当前有 SQLite 与 PostgreSQL 两种 driver；`sqlite`、`postgres`、`postgresql`、`pg` 都归一到 `sql` provider。没有 MySQL native driver。

Service 是公共能力入口，CLI 是其命令视图。`woctl service type sql --typescript` 显示五个服务方法的输入与结果类型；`service schema <name> --json` 提供对应工具的 inputSchema/outputSchema。类型与 schema 发现不创建 driver、不读取凭据。

## 配置与选择

离线查询示例 `woctl.yaml`：

```yaml
version: 1
currentContext: local
services:
  - name: scratch
    type: sqlite
    readOnly: true
    options:
      filename: ':memory:'
defaults:
  services:
    sql: scratch
```

PostgreSQL 条目模板（占位 URL，不会自动读取环境变量）：

```yaml
services:
  - name: reporting
    type: postgres
    readOnly: true
    baseUrl: postgresql://example.test:5432/docs
    options:
      ssl: true
      timeoutMs: 30000
      connectTimeoutMs: 10000
      maxRowLimit: 10000
defaults:
  services:
    sql: reporting
```

这是完整 native 层的 `services/defaults` 部分，可放基础或 context 文件。用 `type: sql` 时可通过 `options.dialect: sqlite|postgres` 指定；filename 或 file:/sqlite: URL 可以触发 SQLite 推断，其他情况默认 PostgreSQL。SQLite 不指定 filename 时使用 `:memory:`。

timeoutMs、connectTimeoutMs 为 1..3600000 的整数，默认分别 30000/10000；SQLite 的 connectTimeoutMs 用作 busy timeout。maxRowLimit 为正整数，默认 10000。query/list 默认 limit 为 `min(100, maxRowLimit)`、offset 为 0。命令不跨进程共享内存数据库，每次 CLI 调用都会建立并关闭自己的连接。

```sh
woctl --config ./woctl.yaml sql --help
woctl --config ./woctl.yaml sql --list-services --json
woctl --config ./woctl.yaml sql query 'SELECT 1 AS value' --service scratch --json
woctl --config ./woctl.yaml service default set sql scratch
```

多个 SQL 服务且无有效默认值会报歧义；`--service` 优先于默认值，`-c dev` 切换整套候选集合。细节见 [配置](../configuration.md)。`--list-services` 只接受在 `sql` 根执行，不与 query 合用。

## 实际命令树

```text
sql
  query / q <statement...>         --params --var --limit --offset
  exec <statement...>              --params --var --limit --offset --yes
  explain <statement...>           --params --var --limit --offset
  ping
  list                            --schema --search --limit --offset
  table list / ls                 --schema --search --limit --offset
  table info / describe / desc <table>
                                  --schema --search --limit --offset
```

`sql list` 是平铺的表列表入口，没有 `ls` 别名；`table info` 虽声明共享 table 选项，实际详情只使用 table 与 schema，不做 search/分页。`exec` 虽解析共享 limit/offset，但执行只传 statement/params，不对写入进行分页。`explain` 只接受只读语句，自动加 EXPLAIN 前缀。

```sh
woctl sql ping --service scratch --json
woctl sql query 'SELECT 42 AS answer' --service scratch --output table
woctl sql explain 'SELECT 42 AS answer' --service scratch --json
woctl sql table ls --service scratch --schema main --limit 20 --json
woctl sql table info sample --service scratch --schema main --json
```

最后一条要求数据库已有 sample 表；内存示例没有该表。可以使用 `schema.table`，也可通过 `--schema` 覆盖 schema。

## 文件与绑定参数

SQLite 用 `?`，PostgreSQL 用 `$1`、`$2`。参数作为值绑定，不把变量插进 SQL 文本，也不支持绑定表名/SQL 关键字。

```sh
woctl sql query 'SELECT ? AS value' --params '["hello"]' --service scratch --json
woctl sql query 'SELECT ? AS value' --var '1="hello"' --service scratch --json
woctl sql query 'SELECT $1 AS value' --params '["hello"]' --service reporting --json
woctl sql query @query.sql --params @params.json --service scratch --json
printf 'SELECT 1 AS value' | woctl sql query - --service scratch --json
```

`query.sql` 内容：

```sql
SELECT ? AS value
```

`params.json` 内容：

```json
["hello"]
```

也可以准备 `query.json`：

```json
{"statement":"SELECT ? AS value","params":["from file"],"limit":10,"offset":0}
```

```sh
woctl sql query @query.json --var '1="override"' --limit 1 --service scratch --json
```

`.yaml/.yml` 接受同样对象；`query` 可作为 `statement` 的别名。`.sql` 和 stdin 是纯 SQL，不解析 JSON envelope。SQL 文件、参数文件和 SQL 文本受 1 MiB 限制。优先级：文件 params → `--params` 整体替换 → 每个 `--var` 覆盖指定位置；缺失位置补 null。var 值先 JSON.parse，失败则字符串；`--limit/--offset` 覆盖文件值。limit 必须为正安全整数且不超过 maxRowLimit，offset 为非负安全整数。

## 自有临时库写入流程

以下只在自己新建的临时目录内执行。创建 `woctl.yaml`：

```yaml
services:
  - name: scratch
    type: sqlite
    readOnly: false
    options:
      filename: ./scratch.sqlite
defaults:
  services:
    sql: scratch
```

filename 为相对当前工作目录的路径，不相对配置目录。不要把该示例指向已有数据库。

```sh
woctl --config ./woctl.yaml sql exec 'CREATE TABLE sample (id INTEGER PRIMARY KEY, value TEXT)' --service scratch --yes --json
woctl --config ./woctl.yaml sql exec 'INSERT INTO sample (value) VALUES (?)' --params '["example"]' --service scratch --yes --json
woctl --config ./woctl.yaml sql query 'SELECT id, value FROM sample' --service scratch --json > rows.json
woctl --config ./woctl.yaml sql table info sample --service scratch --json
```

完成后清理自己创建的临时目录和库。`exec` 同时要求 `readOnly: false` 与 `--yes`；缺少确认或选中只读服务会在文件读取/driver 创建前拒绝。`query` 即使选择可写服务也拒绝写 SQL。SQLite 子进程和 PostgreSQL 只读事务提供各自的数据库层约束。

通用工具入口为 `ping/query/exec/listObject/describeObject`，可通过 `service schema scratch` 核对。`service call scratch exec --input ... --yes` 同样要求 writable 和显式确认；领域命令还提供 SQL 文件、参数绑定与专用输出流程。

## 输出、错误与宿主

query/exec/explain 的 JSON 结果包含 columns、rows 等执行信息；table list 返回对象列表，table info 返回 object/children。表格模式使用专用列投影。完整结果用 `--json`，CSV/字段投影见 [命令约定](../patterns.md)。

参数、只读和选择错误多为退出 2；driver 创建/SQL 执行等普通异常通常退出 1；取消异常为 130，详见 [退出码](../patterns.md#错误与退出码)。错误会泛化，未必包含数据库原始错误文本。

Native 注入本地 SQL driver；Web 默认没有 driver，需宿主显式注入可用适配器或远程 runtime。浏览器不能直接使用 Node SQLite/pg。远程 SQL 协议按 query/exec 等工具传输，服务端负责 SQL 方言与授权。当前 tool client 的 dialect 是 `remote`，SQL `explain` 的客户端方言检查对该模式仍需专项验证，不承诺远程 explain 可用。

## 证据

定义在 `packages/wener-common/src/service/sql/cli/SQLCliDefinition.ts`，文件准备在同目录 `prepareStatement.ts`。离线合同见 `SQLCliDefinition.test.ts`、`sql/sql.test.ts`；真实 SQLite driver 用例和 mock PostgreSQL pool 在 `apps/woctl/src/native/sql.test.ts`，应用临时文件库链路在 `apps/woctl/src/sql.integration.test.ts`。上述测试通过，未连接真实 PostgreSQL；最终运行状态统一见 [覆盖表](../coverage.md)。
