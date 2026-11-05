# 实现覆盖与验证证据

本表依据当前源码及实际执行核对。**测试文件存在不等于测试已经通过。** 最新 TTS 接入后的验证：woctl、公共 service/cli、Linear/TTS client、common PDF/XLSX 共 **115 文件 1173 项测试通过**；woctl/common/wener-common/wener-client 四包 TypeScript 检查及 CLI/Web/shell 构建通过。验证直接调用已安装的 Node 工具；复用已安装的 ws，补充其类型依赖声明，没有下载或重装工作区。结果对应工作区，当前 npm 0.1.1 不包含本轮新增能力。

此前临时 tarball 安装后完成 PDF/Excel、Redis 七类操作和 SQLite SQL/schema 验证；公网 direct fetch 与 DuckDuckGo 搜索各一次成功。Exa/Jina 没有真实凭据调用。这些是历史切片证据，本轮没有重复真实供应商调用。

此前 OpenObserve client 252 项等证据保留在对应服务指南，不计作本轮重跑结果。

Prometheus 后续补齐 `query/range --query` 表达式、文件、stdin 输入和重复 matcher：定向 56 项测试通过，独立审查重跑其中 45 项通过；CLI 构建后连接临时 HTTP fixture，验证六类操作和 query 文件/stdin 的 7 个实际请求。未连接真实生产 Prometheus/VictoriaMetrics。

## 功能与离线证据

路径均相对于仓库根目录，可直接定位复查；“待运行”表示本轮没有执行该测试。以下已通过项来自上述套件，源码之外的真实网络行为单列。

| 范围 | 当前实现 | 离线测试源码/证据路径 | 本轮运行状态 |
| --- | --- | --- | --- |
| 命令可见性、context 快照 | 按启用 provider 过滤 help/describe/dispatch；保留本地 prompt render | `apps/woctl/src/command-visibility.test.ts`、`wocli.test.ts` | 通过 |
| 同类服务选择、默认值 | 显式 service、capability defaults、provider defaults、唯一候选、歧义拒绝 | `apps/woctl/src/services-array.test.ts`、`capability-defaults.test.ts`、`search.integration.test.ts`、`openobserve.integration.test.ts` | 通过；静态发现不解析凭据、不发请求 |
| Native 配置 | 数组 services、defaults.services、独立 overlay；revision/锁/文件所有权检查 | `packages/common/src/context/CliConfigLayer.test.ts`、`serializeCliConfig.test.ts`；`apps/woctl/src/native/config.test.ts`、`config-ownership.test.ts`、`native-config.integration.test.ts` | 应用配置测试通过；common/context 本轮未重跑 |
| SQL 公共定义与参数 | query/exec/explain/ping、table list/info；文件、params、var、确认 | `packages/wener-common/src/service/sql/cli/SQLCliDefinition.test.ts`、`sql/sql.test.ts` | 通过 |
| SQL native SQLite | 子进程 driver，参数绑定、分页、对象发现、只读、取消/超时 | `apps/woctl/src/native/sql.test.ts`；内存数据库用例 | 通过 |
| SQL 应用集成 | 共享 registry 到 native driver 的调用链 | `apps/woctl/src/sql.integration.test.ts`；使用自行 mkdtemp 的 SQLite 文件并清理 | 通过 |
| SQL 服务契约 | 五方法输入/输出 schema、明确 TypeScript 结果类型、无 I/O 发现 | `packages/wener-common/src/service/sql/contract.test.ts`、`apps/woctl/src/sql-contract.integration.test.ts` | 通过；真实 SQLite 五方法结果直接用 AJV2020 校验 outputSchema，包含可选 describeObject.durationMs |
| SQL PostgreSQL | pg driver、只读事务、绑定参数、分页、取消/超时 | `apps/woctl/src/native/sql.test.ts` 的注入 pool 用例 | 通过；mock pool 不能证明真实 PostgreSQL 可用 |
| DuckDuckGo | typed search、generic tool、ddg CLI；IA/HTML 回退和 offset | `packages/wener-common/src/service/providers/duckduckgo.test.ts`、`search.service.test.ts`；`apps/woctl/src/services/duckduckgo.test.ts`、`search.integration.test.ts` | 通过；fixture 不等于公网搜索 |
| search | 根 search、DuckDuckGo/Exa、域名/日期/内容筛选、串联抓取与 raw | `apps/woctl/src/search.integration.test.ts`；`packages/wener-common/src/service/providers/exa.test.ts`、`search.service.test.ts` | 通过；串联失败/取消先结束操作再关闭客户端，各输出保留抓取结果 |
| fetch | 根 fetch、base/direct、jina、exa；HTML 转 Markdown、正文提取、generic call 与 IFetchService | `apps/woctl/src/fetch.integration.test.ts`；`packages/wener-common/src/service/providers/fetch.test.ts`、`exa.test.ts`、`fetch/content.test.ts` | 通过；Jina client 本轮未重跑；原始响应显式请求且脱敏 |
| PDF | info/inspect/read/parse/render、四类模板、PDF.js 与 PDFium/CanvasKit | `packages/common/src/pdf/pdf.test.ts`、`apps/woctl/src/native/pdf/pdf.test.ts` | 通过；临时生成 PDF，安装包读取及 PNG 输出通过 |
| Excel / XLSX | read/inspect/props/list/edit/tidy/export、样式、CSV/BOM、数字表名、大表 | `packages/common/src/xlsx/xlsx.test.ts`、`xlsx.large.test.ts`；`apps/woctl/src/native/xlsx` 下测试 | 通过；实际 WASM 读写，20 万行回归与安装包 CSV 导出通过 |
| 文档 render | 原生 PDF/XLSX 自动识别、页/表/区域选择、纯 CSV 输出 | `apps/woctl/src/document-render.test.ts`、`native/xlsx/xlsx.test.ts` | 通过；Web bundle 不引入 Node 文档解析器 |
| provider/registry/runtime | builtin 注册、按能力加载、实例生命周期、禁用与只读 | `packages/wener-common/src/service/builtin/builtin.test.ts`、`registry/index.test.ts`、`runtime/runtime.test.ts`、`runtime/service-availability.test.ts` | 通过 |
| 静态 catalog 与注册 | typed operations、不可变 CLI binding、完整 raw tree、四格式导出、文档漂移检查 | `apps/woctl/src/catalog.test.ts`、`catalog.integration.test.ts`；公共 `runtime/operations.test.ts`、`cli/ServiceCliBinding.test.ts` | 通过；AJV 实际校验、各 provider 和组合 TS 编译、环境/配置零读取；生成 reference --check 通过 |
| Linear | 独立 HTTP/GraphQL client、完整 11 操作 service/contract/provider/CLI、分页/筛选/clear/@file/确认/取消 | `packages/wener-client/src/linear/http-adapter.test.ts`；公共 `service/linear` 下测试；`apps/woctl/src/linear.integration.test.ts` | 107 项 client/service/CLI 核心测试、17 项应用集成通过；构建后的 CLI 对本地 GraphQL fixture 完成 11 操作及文件输入输出；真实 Linear 未连接 |
| TTS | 默认临时 Edge、音色列表、OpenAI-compatible 模型、文件/stdin、二进制文件/stdout、参数预检 | `packages/wener-client/src/tts`、公共 `service/tts` 下测试；`apps/woctl/src/tts.integration.test.ts` | Edge/Node45、OpenAI55、service/preflight49、应用23项通过；PCM正常采样和14组纯预检零I/O由独立审查复验；解包CLI无node_modules实际Edge合成16992bytes MP3通过；模型服务用mock验证 |
| 私有 Node 链接宿主 | `woctl/node` 工作区 TS 入口，追加 command/provider/binding | `apps/woctl/src/node.test.ts`、`node-cjs.test.ts` | 3 项通过；真实临时 pnpm link、外部 consumer tsc、ESM/CJS esbuild 和 Node 执行，公开 Linear 与私有命令共存，CJS PDF/XLSX 模块相对资源定位，配置/网络/信号处理零隐式副作用；不是 npm SDK 验收 |
| 领域文件输出 | service 命令的 `--output-file`，同一 renderer，`-` 为 stdout | `apps/woctl/src/linear.integration.test.ts`；独立审查内存验证 | 无宿主写端口时在操作前拒绝；JSON 保留完整数据、根 list-services 写文件、写入失败和取消传播通过 |
| Redis / Valkey | 七只读方法、prefix、SCAN 全量边界、hash/stream、TLS/超时/重试、native driver | `packages/wener-common/src/service/redis` 下测试、`apps/woctl/src/redis.integration.test.ts`、`native/redis.test.ts` | 通过；自建 Redis 验证 Lua 数据限制、自动重连与清理，独立安装 CLI 验证七方法及前缀隔离 |
| 领域表格输出 | CliTable 交给普通 renderer 的 table 参数，JSON 保留原始数据 | `apps/woctl/src/service-table-output.test.ts` | 先失败复现 headers/rows 被当对象输出，修正后回归与领域集成通过 |
| system | 本地 info/echo 和通用调用链 | `apps/woctl/src/core.ts`、`wocli.test.ts` | 应用测试通过 |
| MCP | servers/tools/resources/read/info/call/grep、连接关闭 | `apps/woctl/src/commands/mcp.test.ts`；`packages/wener-client/src/mcp/connectMcpServer.test.ts` | CLI 测试通过；client 本轮未重跑；外部服务器未测 |
| AI 目录与 prompt | provider/model/prompt 管理、生成、dump、模板、结构化、SSE | `apps/woctl/src/commands/ai.test.ts`；`packages/common/src/context/AiCatalog.test.ts`、`AiConfig.test.ts`；`packages/common/src/ai/prompt/execute.errors.test.ts` | CLI 测试通过；common AI 测试本轮未重跑；真实 provider 未测 |
| 输出和 IO | 普通 renderer/字段投影、基础 WebStream adapter | `packages/wener-common/src/service/cli/createServiceCliCommand.test.ts`、`packages/wener-common/src/cli/CliIO.test.ts` | 通过；未证明完整背压/abort |
| Native 发布入口 | CLI bundle、PDF/Excel 运行依赖、双语 README、第三方许可 | `apps/woctl/src/built-cli.test.ts`、`scripts/build.ts`；独立临时目录 tarball 验证 | 历史4文件安装样本的PDF/XLSX资源验证保留；当前加入NOTICES为5个包自身文件，解包后默认TTS无需额外ws模块，完整MIT通知验证通过；未发布新版 |
| Web/shell | 显式宿主端口、browser store、虚拟 shell | `apps/woctl/src/web-bundle.test.ts`、`shell.test.ts` | 通过；真实浏览器未验证 |
| OpenObserve | 13 个协议操作、typed API、CLI、按 logs/metrics/traces 分类入口、transport、写入限制 | 详见 [OpenObserve](service/openobserve.md) | client 252、service/CLI 27、应用集成通过；已用 wcli 对部署服务做只读验证，woctl 真实端点仍待回归 |
| Prometheus/VictoriaMetrics | query、query_range、series、labels、label values、metadata、typed API、provider、prometheus/prom CLI；表达式/文件/stdin输入 | 详见 [Prometheus](service/prometheus.md)、`packages/wener-client/src/prometheus/index.test.ts`、`packages/wener-common/src/service/prometheus/cli.test.ts`、`provider.test.ts`、`apps/woctl/src/prometheus.integration.test.ts` | 56项定向测试、本地HTTP真实CLI六操作通过；真实生产端点未连接 |

## 真实服务验证

| 对象 | 本轮状态 | 完成验证还需要什么 |
| --- | --- | --- |
| SQLite 临时自有库 | 已通过应用与 native driver 测试；无用户数据库写入 | 生产环境连接需另行验证 |
| Redis 临时自有实例 | 实际 driver 与安装包 CLI 七方法、prefix、SCAN、重连及响应限额通过；已关闭并清理 | 真实 TLS 握手、生产 ACL/认证未验证 |
| Linear 本地 GraphQL fixture | 构建后的 CLI 完成 11 操作、合成认证、filter/clear、文件输入输出及缺少确认时零请求；已关闭并清理 | 真实 workspace 的查询、权限及写入尚未验证 |
| Edge 在线朗读 | 实际客户端及解包后的CLI完成短句合成，MP3字节/元数据正确；临时音频已清理 | 该内部协议的长期可用性不由单次成功或离线测试保证 |
| 模型 TTS | OpenAI-compatible 请求、MIME/限额/PCM/取消用假响应验证；无私有部署调用 | 实际端点需提供相应speech API、模型与音色 |
| PostgreSQL | 未连接 | 自有临时数据库、最小权限账号；实测 query/exec/分页/取消/只读并清理 |
| DuckDuckGo 公网 | 根 search 一次成功，返回 2 项结果 | IA/HTML fallback 分支、offset 和限流仍主要由离线 fixture 验证 |
| base/direct | 根 fetch 对自有公开页面一次成功，maxCharacters=300 生效 | 不等同于各种 HTML 网站结构都可精确抽取正文 |
| Jina / Exa | 未连接真实供应商 | 自有凭据、可用 reader 和额度；协议与错误映射已有离线测试 |
| MCP stdio/HTTP | 未连接外部服务器 | 可控测试 server，验证握手、tools/resources/call、关闭和取消 |
| AI 各协议 | 未连接 | 用户授权 provider/模型与调用额度；分别验证非流式、SSE、JSON/schema |
| 浏览器 | 未操作真实浏览器 | CORS、宿主注入、文件/存储权限、取消及持续输出 |
| 远程 service runtime | 未连接 | 兼容 schema/call 服务端及服务端授权、错误和断连验证 |

## 已知缺口与核验方法

- SQL native 仅提供 SQLite/PostgreSQL driver，不将 readonly parser 中出现的 MySQL 方言视为 MySQL driver 支持。
- SQL/OpenObserve 专用写命令及 generic `service call` 都检查 writable 与 `--yes`；MCP 和直接 SDK/runtime 调用仍由各自宿主授权。
- fetch 的 `maxCharacters` 是读取后截取，不是网络响应字节上限。
- AI 模型 registry 可描述更多能力；当前 woctl prompt 提供文本消息生成，不代表 embedding、image、audio 等都有 CLI。
- WebStream adapter 不代表全面实现终端背压、drain 或 abort 保障；端到端流行为仍需专项验证。
- 同类服务 root `--list-services` 已有 OpenObserve 离线回归；npm 发布包及所有领域别名的完整组合未逐一验证。

补充证据时记录仓库版本、测试命令、宿主版本、使用的 fixture、实际退出码及清理情况。外部验证应只记录脱敏摘要，不能将凭据、连接串或原始私有日志写入公开文档。
