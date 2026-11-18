# Redis / Valkey

Redis 按统一 service 注册，提供 `IRedisService`、配置和操作 schema、provider、typed client wrapper，以及 `woctl redis`（别名 `woctl valkey`）。原生连接由宿主注入 `ioredis` driver，公共 service 不依赖 Node 网络库。

## 配置与发现

```sh
woctl service add cache --type redis --base-url redis://localhost:6379/0
woctl service default set redis cache
woctl redis --list-services --json
woctl service type info redis --json
woctl service type redis --typescript
woctl service inspect cache --json
```

命令只在当前 context 有启用的 Redis/Valkey 服务时显示。多实例用 `--service <name>` 选择，或设置 provider 默认。帮助、类型、schema 和服务列举均不连接 Redis、不解析密钥。

YAML 示例：

```yaml
services:
  - name: cache
    type: redis
    baseUrl: redis://localhost:6379/0
    options:
      password: env://REDIS_PASSWORD
      keyPrefix: 'app:'
      connectTimeoutMs: 10000
      requestTimeoutMs: 30000
      maxRetries: 2
      maxResponseBytes: 16777216
defaults:
  services:
    redis: cache
```

无认证的自有本地实例省略 password。也可不用 baseUrl，直接设置 `options.host/port/databaseIndex`。可配置 username、product、keyPrefix、TLS、连接/请求超时和重试。配置凭据用 `env://NAME` 在实际调用时解析，不将真实凭据放进示例或 URL。

`rediss://` 启用验证证书的 TLS。`options.tls` 支持 verify-full / verify-ca、serverName、ca、cert、key、passphrase；证书和私钥须成对提供，不能以跳过所有验证的模式连接。`--type valkey` 使用相同 provider；可设置 `options.product: valkey` 表示产品类型。

## 命令与工具

```sh
woctl redis ping --service cache --json
woctl redis get session:example --service cache --json
woctl redis type session:example --service cache --json
woctl redis ttl session:example --service cache --json
woctl redis scan --match 'session:*' --count 100 --service cache --json
woctl redis scan --all --match 'session:*' --type string --service cache --json
woctl redis hgetall user:example --service cache --json
woctl redis xrange events --start - --end + --count 20 --service cache --json
```

`info` / `ping` 执行连通性检查并返回版本和延迟；其余命令映射到通用工具 `get`、`getType`、`getTtl`、`scan`、`getHash`、`rangeStream`。

```sh
woctl service call cache get --input '{"key":"session:example"}' --json
woctl service call cache scan --input '{"cursor":"0","match":"session:*","count":100}' --json
```

count 范围为 1..10000；SCAN 的 count 是服务端提示，不是结果条数保证。`scan --all` 跟随游标至 0，检测游标循环，并限制累计 100000 个 key、64 MiB key 数据、10000 次迭代，超过上限会明确失败。

配置 `keyPrefix: 'app:'` 后，读取 `session:example` 实际访问 `app:session:example`；扫描只返回匹配前缀的 key，并移除前缀后展示。前缀会按字面量转义，不能通过扫描 glob 越出该前缀。它是读取范围约定，Redis 服务端 ACL 仍应按实际权限配置。

服务和 native adapter 保留单次响应及 hash/stream 总量限制；默认 16 MiB，可配置至 64 MiB。多次扫描仍应检查页数和截断状态。

## 只读与宿主

本次迁移与源实现一致，提供七类只读操作，没有 SET、DEL、任意命令、脚本写入或管理命令；`readOnly: false` 会被拒绝。native adapter 内部使用固定的只读 Lua 逻辑控制返回数据大小，连接账号需要相应的 EVAL 与读取权限。

Node 默认注入 driver；Web 可以使用远程 runtime 或显式注入自己的 driver，不能直接在浏览器中加载 TCP/TLS 客户端。错误转换为固定的服务错误，帮助和诊断不回显连接密码或原始 driver 错误。关闭操作幂等，取消会停止等待并由宿主关闭本次连接。
