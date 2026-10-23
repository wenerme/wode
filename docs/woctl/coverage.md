# 实现覆盖与验证证据

本表依据当前源码及实际执行核对。**测试文件存在不等于测试已经通过。** 当前工作区验证：woctl 完整套件 20 文件 140 项、wener-common service/CliIO 14 文件 227 项、OpenObserve client 4 文件 252 项通过；client/common/woctl 三包 TypeScript 检查通过。只调用已安装的 node 工具入口，没有安装依赖，也未连接真实外部服务。结果对应当前开发工作区，不代表 npm 已发布版本。

## 功能与离线证据

路径均相对于仓库根目录，可直接定位复查；“待运行”表示本轮没有执行该测试。以下已通过项来自上述套件，源码之外的真实网络行为单列。

| 范围 | 当前实现 | 离线测试源码/证据路径 | 本轮运行状态 |
| --- | --- | --- | --- |
| 命令可见性、context 快照 | 按启用 provider 过滤 help/describe/dispatch；保留本地 prompt render | `apps/woctl/src/command-visibility.test.ts`、`wocli.test.ts` | 通过 |
| 同类服务选择、默认值 | 显式 service、provider defaults、唯一候选、歧义拒绝 | `apps/woctl/src/services-array.test.ts`、`commands/service-extra.test.ts`、`openobserve.integration.test.ts` | 通过；OpenObserve 枚举不解析凭据、不发请求 |
| Native 配置 | 数组 services、defaults.services、独立 overlay；revision/锁/文件所有权检查 | `packages/common/src/context/CliConfigLayer.test.ts`、`serializeCliConfig.test.ts`；`apps/woctl/src/native/config.test.ts`、`config-ownership.test.ts`、`native-config.integration.test.ts` | 应用配置测试通过；common/context 本轮未重跑 |
| SQL 公共定义与参数 | query/exec/explain/ping、table list/info；文件、params、var、确认 | `packages/wener-common/src/service/sql/cli/SQLCliDefinition.test.ts`、`sql/sql.test.ts` | 通过 |
| SQL native SQLite | 子进程 driver，参数绑定、分页、对象发现、只读、取消/超时 | `apps/woctl/src/native/sql.test.ts`；内存数据库用例 | 通过 |
| SQL 应用集成 | 共享 registry 到 native driver 的调用链 | `apps/woctl/src/sql.integration.test.ts`；使用自行 mkdtemp 的 SQLite 文件并清理 | 通过 |
| SQL PostgreSQL | pg driver、只读事务、绑定参数、分页、取消/超时 | `apps/woctl/src/native/sql.test.ts` 的注入 pool 用例 | 通过；mock pool 不能证明真实 PostgreSQL 可用 |
| DuckDuckGo | typed search、generic tool、ddg CLI；IA/HTML 回退和 offset | `packages/wener-common/src/service/providers/duckduckgo.test.ts`、`search.service.test.ts`；`apps/woctl/src/services/duckduckgo.test.ts`、`search.integration.test.ts` | 通过；fixture 不等于公网搜索 |
| fetch | base/direct、jina；generic call 与 IFetchService | `packages/wener-common/src/service/providers/fetch.test.ts`；`packages/wener-client/src/jina/JinaReaderClient.test.ts` | provider 测试通过；Jina client 本轮未重跑；没有顶级 fetch CLI |
| provider/registry/runtime | builtin 注册、按能力加载、实例生命周期、禁用与只读 | `packages/wener-common/src/service/builtin/builtin.test.ts`、`registry/index.test.ts`、`runtime/runtime.test.ts`、`runtime/service-availability.test.ts` | 通过 |
| system | 本地 info/echo 和通用调用链 | `apps/woctl/src/core.ts`、`wocli.test.ts` | 应用测试通过 |
| MCP | servers/tools/resources/read/info/call/grep、连接关闭 | `apps/woctl/src/commands/mcp.test.ts`；`packages/wener-client/src/mcp/connectMcpServer.test.ts` | CLI 测试通过；client 本轮未重跑；外部服务器未测 |
| AI 目录与 prompt | provider/model/prompt 管理、生成、dump、模板、结构化、SSE | `apps/woctl/src/commands/ai.test.ts`；`packages/common/src/context/AiCatalog.test.ts`、`AiConfig.test.ts`；`packages/common/src/ai/prompt/execute.errors.test.ts` | CLI 测试通过；common AI 测试本轮未重跑；真实 provider 未测 |
| 输出和 IO | 普通 renderer/字段投影、基础 WebStream adapter | `packages/wener-common/src/service/cli/createServiceCliCommand.test.ts`、`packages/wener-common/src/cli/CliIO.test.ts` | 通过；未证明完整背压/abort |
| Native 发布入口 | CLI bundle、unbundled 公共导出和启动 | `apps/woctl/src/built-cli.test.ts`、`scripts/build.ts`、`packages/wener-common/tests/built-cli-publish-smoke.mjs` | CLI/web/shell 构建及 public exports consumer 通过；未验证 npm 安装包 |
| Web/shell | 显式宿主端口、browser store、虚拟 shell | `apps/woctl/src/web-bundle.test.ts`、`shell.test.ts` | 通过；真实浏览器未验证 |
| OpenObserve | 13 个协议操作、typed API、CLI、transport、写入限制 | 详见 [OpenObserve](service/openobserve.md) | client 252、service/CLI 27、应用集成 12 项通过；真实服务未测 |

## 真实服务验证

| 对象 | 本轮状态 | 完成验证还需要什么 |
| --- | --- | --- |
| SQLite 临时自有库 | 已通过应用与 native driver 测试；无用户数据库写入 | 生产环境连接需另行验证 |
| PostgreSQL | 未连接 | 自有临时数据库、最小权限账号；实测 query/exec/分页/取消/只读并清理 |
| DuckDuckGo 公网 | 未连接 | 授权联网；分别检查 IA、HTML 回退、offset 及错误行为 |
| base/Jina | 未连接 | 自有公开测试页面及可用 reader，验证网络和内容结果 |
| MCP stdio/HTTP | 未连接外部服务器 | 可控测试 server，验证握手、tools/resources/call、关闭和取消 |
| AI 各协议 | 未连接 | 用户授权 provider/模型与调用额度；分别验证非流式、SSE、JSON/schema |
| 浏览器 | 未操作真实浏览器 | CORS、宿主注入、文件/存储权限、取消及持续输出 |
| 远程 service runtime | 未连接 | 兼容 schema/call 服务端及服务端授权、错误和断连验证 |

## 已知缺口与核验方法

- SQL native 仅提供 SQLite/PostgreSQL driver，不将 readonly parser 中出现的 MySQL 方言视为 MySQL driver 支持。
- SQL/OpenObserve 专用写命令及 generic `service call` 都检查 writable 与 `--yes`；MCP 和直接 SDK/runtime 调用仍由各自宿主授权。
- fetch 尚无顶级 CLI；`maxCharacters` 是读取后截取，不是网络响应字节上限。
- AI 模型 registry 可描述更多能力；当前 woctl prompt 提供文本消息生成，不代表 embedding、image、audio 等都有 CLI。
- WebStream adapter 不代表全面实现终端背压、drain 或 abort 保障；端到端流行为仍需专项验证。
- 同类服务 root `--list-services` 已有 OpenObserve 离线回归；npm 发布包及所有领域别名的完整组合未逐一验证。

补充证据时记录仓库版本、测试命令、宿主版本、使用的 fixture、实际退出码及清理情况。外部验证应只记录脱敏摘要，不能将凭据、连接串或原始私有日志写入公开文档。
