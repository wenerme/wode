# woctl

Wode 的命令宿主。Node CLI、可嵌入的 Web SDK 和静态网页共用命令定义、context 和 service 调用链。

## 运行与构建

从仓库根目录执行：

```sh
pnpm --filter woctl dev --help
pnpm --filter woctl dev service add system --provider system
pnpm --filter woctl dev system info --json
pnpm --filter woctl dev system echo 'Hello, Wener' --json
pnpm --filter woctl dev:web

pnpm --filter woctl build
node apps/wocli/dist/cli.js --help
pnpm --filter woctl preview
```

构建产物：

| 文件 | 用途 |
| --- | --- |
| `dist/cli.js` | Node 24+ CLI，可直接执行 |
| `dist/web.js` | 浏览器 ESM SDK，包含依赖 |
| `dist/shell.js` | just-bash 自定义命令适配器，调用相同 Web SDK |
| `dist/site/` | workspace 中可部署在任意静态服务器的页面，支持子路径 |

Web SDK 和静态页面均无需 Node polyfill。页面直接在浏览器执行命令，默认将配置保存在当前 origin 的 localStorage。SDK 默认只使用内存 store；远端服务仍需 HTTP 可达，并允许页面 origin 的 CORS 请求。

`dist/cli.js` 是 Node 24+ 的 native CLI bundle；它需要 Node 运行时，不是无需运行时的独立机器码。产品命令是 `woctl`，可直接使用 `npx woctl`。npm `0.1.1` 首发修正版只包含一个 `dist/cli.js` bundle、README 和包 metadata；`apps/wocli/src/web.ts` 与 `apps/wocli/src/shell.ts` 是 workspace 内的源码入口，未来如需 console 会以内联资源方式处理，本轮不提供 console server。`info`、`context check` 和 `service verify/check` 只读取当前配置快照，不请求远端 schema、不创建 service client、不解析实际密钥。`--log-level trace|verbose|debug|info|warning|error` 和 `--verbose` 只将安全诊断写入 stderr，默认保持静默。

## Context 与服务

```sh
woctl context list
woctl context create dev
woctl context use dev
woctl context show --json
woctl info --json
woctl context check --json
woctl service list --context local --json
woctl service verify --json
woctl service check --strict --json
woctl service providers
woctl service default show --json
woctl service inspect system

woctl service add gateway --provider http --url https://example.com/api --id remote-service
woctl service schema gateway --json
woctl service call gateway operation --input '{"key":"value"}' --json
woctl service call system echo --input @input.json --json
printf '{"text":"stdin"}' | woctl service call system echo --input - --json

# MCP（Node CLI；实际命令才连接 server）
woctl mcp servers --json
woctl mcp tools demo --json
woctl mcp resources demo --json
woctl mcp read demo fixture://hello
woctl mcp info demo echo --json
woctl mcp call demo echo '{"text":"hello"}' --json
woctl mcp grep '*search*' --json
```

Node 使用 base 与一个选中 context 文件。base 默认是 `~/.wode/woctl.yaml`，context 是同目录的 `woctl.CONTEXT.yaml`。`--config <path>` 优先于 `WOCTL_CONFIG`，当前也读取旧变量 `WOCLI_CONFIG` 作为临时回退；自定义 `config.yml` 对应 `config.CONTEXT.yml`，只支持 `.yaml`/`.yml`。选择顺序为 `--context/-c`、`WOCTL_CONTEXT`、旧变量 `WOCLI_CONTEXT` 回退、base `currentContext`、`local`，临时选择不改变持久默认值。

缺失 base 返回空 globals；缺失 local 文件使用 base-only 配置。选中其他 context 时文件必须存在。读取仅打开 base 和选中 overlay，其他 context 只枚举文件名；不会自动创建文件或注入 system 服务。可用 `service add system --provider system` 显式添加。

环境变量：

- `WOCTL_CONFIG`：base 配置路径；`WOCLI_CONFIG` 仅作读取回退。
- `WOCTL_CONTEXT`：本次选择的 context；`WOCLI_CONTEXT` 仅作读取回退。
- `WOCTL_LOG_LEVEL`：日志级别；`WOCLI_LOG_LEVEL` 仅作读取回退。

正式变量优先于旧变量；woctl 不会写回这些环境变量。

base 示例：

```yaml
version: 1
currentContext: local
services:
  - name: system
    type: system
    readOnly: true
defaults:
  services:
    system: system
```

独立的 `woctl.dev.yaml` 示例：

```yaml
services:
  - name: gateway
    type: http
    id: remote-service
    baseUrl: https://example.com/api
    readOnly: true
defaults:
  services:
    http: gateway
```

native 文件的 `services` 必须是数组，以 `name` 标识实例，`type` 或 `api` 指定适配器；不接受 services map、provider-only 条目或内联 `contexts`，context 文件也不能设置 `version/currentContext`。未知类型可保存，调用时仍需已注册适配器。`disabled: true` 或 `enabled: false` 的条目保留在管理列表中，但不能调用。

同名服务由 context 整条替换，空数组不删除继承项；`defaults.services` 按 key 覆盖。AI providers、defaultModel 和 prompts 继续按现有 context 规则覆盖。`service remove` 只删除 context 自有条目；继承删除没有 tombstone/null 语法。`context show` 隐藏 headers、options 和 URL 凭据/query。

编辑继承的 AI provider 中的模型时，`providerCopy` 会将该 provider 的完整副本（包括已配置的认证字段）写入所选 overlay，再修改模型。这是该 provider 的显式覆盖，不会将其他继承目录一并写入 overlay。

服务、AI 和 prompt 编辑只写所选 overlay；`context use` 修改 base 的持久默认值，`context create/remove` 创建或删除独立 context 文件。多文档修改在写入前拒绝。Node store 的 `load({ context? })` 返回编辑快照，`save(config)` 必须接收该次 load 的原对象；不要先克隆再保存，store 会统一验证。未加载的其他 context 占位不能编辑。Native `createContext(name, { context? })` 根据物理文件判断重复，因此 `context create local` 可以创建缺失的 local overlay。

单文档保存使用独占 `.lock`、读取时的内容修订检查及 tmp + rename，文件权限为 0600，新目录为 0700。冲突报错并要求重新加载，不自动移除既有锁。此协议协调使用同样锁的写入者；不保证任意外部编辑器的修改与 rename 之间形成全事务。

扩展字段在解析和保存时保留。读取和帮助不会重写文件；显式保存输出 canonical 数组，YAML 注释和排版不保留。Browser/memory store 使用内部 aggregate 视图；命令目录按有效 context 重新准备。

`context check` 和 `service verify` 是离线配置检查：启用服务、禁用服务和未知 provider 会分别显示状态；缺失、禁用或 provider 不匹配的默认服务会返回失败。未知 provider 在普通模式下是 warning，`--strict` 会将 warning 变成失败。`service check` 是 `service verify` 的别名。配置损坏时 `info` 仍能显示安全的运行时和配置路径摘要，其他配置依赖命令继续返回配置错误。

MCP 配置放在 base 或选中 context 的 `mcpServers` 下。`stdio` server 使用 `command`、`args`、`env`、`cwd`；`http` server 使用 `url`、可选 `headers` 和 `timeout`。同名 context server 覆盖 base server，`enabled: false` 的 server 保留在 catalog 但不会连接。`mcp servers/list` 只读配置，不启动进程；tools/resources/read/info/call/grep 才建立一次连接并在命令结束时关闭。目录输出会隐藏 headers、env，并脱敏 URL query 和疑似 token 参数。

```yaml
mcpServers:
  local-tools:
    transport: stdio
    command: node
    args: [./tools/mcp-server.mjs]
    env:
      MCP_MODE: local
  remote-tools:
    transport: http
    url: https://example.com/mcp
    headers:
      Authorization: Bearer <MCP_TOKEN>
```

`mcp` 当前是 Node CLI 的基础 MCP client 能力，支持 server catalog、tool/resource discovery、resource read、tool call 和 glob 搜索。headers 使用显式值；`<MCP_TOKEN>` 只是文档占位符，woctl 当前不会对 `${MCP_TOKEN}` 或其他环境变量做插值，也不会替用户生成真实 secret。gateway/SSE 对外暴露、动态命令生成、NATS/connect transport 及 Web SDK MCP 仍属于后续能力；它们不会被当前 npm 版本宣称为已支持。

HTTP provider 对接与参考 wcli 一致的接口：`GET /service/{service}/schema` 和 `POST /service/{service}/call`，调用 body 为 `{ toolName, input }`。Schema 的 `tools` 是以工具名为 key 的对象，工具包含 `inputSchema` 与可选 `annotations.readOnlyHint`。默认只允许标记为只读的工具；配置 `readOnly: false` 或添加服务时使用 `--writable` 才允许写工具。服务端负责认证、可见性和最终授权。

`service default set <provider> <service>` 修改所选 context 的默认服务；`unset <provider>` 移除该 context 的覆盖，继续继承根 defaults。`service inspect` 默认列出只读工具、必填输入和调用模板，`--writable` 展示全部工具，`--json` 返回原始 schema。

## Render 与 Markdown

```sh
woctl render README.md --no-color
woctl markdown --text '# Hello'
cat input.json | woctl render - --input json --format yaml
woctl render input.json --format table
woctl render article.md --format text -o article.txt
```

按文件名识别 Markdown、JSON、JSONL、YAML 和代码；stdin 可用 `--input` 指定类型。`markdown` 的别名是 `md`。Markdown 支持 GFM 表格、列表和代码块；默认按宿主 TTY 决定 ANSI 样式。`-o/--output` 是输出文件，`-f/--format` 选择渲染格式。Web SDK 读取或写入文件需要宿主提供 `readText/writeText`，just-bash 使用虚拟文件系统。

## Provider、Model 与 Prompt

```sh
woctl provider types
woctl provider add example --api openai --url https://example.com/v1
woctl model add fast --provider example --id upstream-model --max-output-tokens 1024
woctl model use example/fast
woctl provider list --json
woctl model list --json
woctl prompt 'Hello' --dump
woctl prompt 'Hello' --stream
woctl prompt 'Hello' --json

woctl prompt import summarize --text 'Summarize {{text}}'
woctl prompt render summarize --var text=article
woctl prompt @summarize --var text=article
```

AI provider 与 model 按 context 配置，model 使用 `provider/name` 标识，`model use` 设置默认值；`context provider` 与 `context model` 也提供同样的目录命令。模型协议支持 `openai`、`openai-response`、`anthropic` 和 `gemini`，共用 GenerateMessage codec。Anthropic 需要配置 `max-output-tokens`。认证可使用 provider 的 `apiKey` 或 `headers`，Node 宿主支持 `apiKeyEnv: VARIABLE_NAME`（CLI 使用 `--api-key-env VARIABLE_NAME`）；浏览器由宿主显式注入环境映射。目录与 context 展示会隐藏认证值、headers 和 URL query。

`prompt` 的别名是 `p`，支持 `--model`、`--system`、`--stream`、`--json`、`--jsonschema` 和 `--var key=value`。`--dump` 仅输出脱敏请求，不发网络请求；模板 `list/show/import/remove/render` 均可离线使用，支持带 YAML frontmatter 的 dotprompt。`--stream --json` 聚合完整结果后输出 JSON；普通流式输出通过宿主 `io.write` 回调传递，未提供该回调时在完成后输出全文。浏览器跨域调用仍由目标 provider 的 CORS 策略决定。

`service providers`（兼容入口 `provider types`）列出服务插件；AI provider 用 `provider list` 查看。

## 嵌入 Web

```ts
import { createMemoryCliConfigStore, createWocliWebCli } from 'woctl/web';

const cli = createWocliWebCli({
  config: createMemoryCliConfigStore({ services: [{ name: 'system', type: 'system' }] }),
});
await cli.executeLine('system echo "Hello, Wener" --json', {
  signal: new AbortController().signal,
  stdout: (text) => console.log(text),
});
```

宿主可以注入 `config` store、`runtime`、`fetch`、`readText/writeText`、`env`、`providers` 和额外 `commands`。`runtime` 使用 common 的 `ServiceRuntimeClient` 接口，不要求宿主持有连接凭据。注入 runtime 时，config 的 service key 应对应该 runtime 接受的 service selector。`execute(argv, io)` 接收已分词参数；`executeLine` 支持引号和转义，不执行 shell 展开、管道或重定向。错误以异常交给宿主；Node 入口映射为退出码。

## 扩展结构

Storybook 中提供交互式终端演示：

```sh
pnpm --filter @wener/ui storybook
pnpm --filter @wener/ui build-storybook
```

打开 `Infrastructure / Shell / Woctl` 或 `Infrastructure / Shell / Bash`。Woctl story 将 `woctl` 注册为 just-bash 命令，支持管道、重定向、`--input @file` 和从 stdin 读取 JSON。每个 story 使用独立的内存配置和虚拟文件系统，不加载 Node 的本地配置。

适配器也可以独立使用：

```ts
import { Bash } from 'just-bash/browser';
import { createWocliShellCommand } from 'woctl/shell';
import { createMemoryCliConfigStore } from 'woctl/web';

const config = createMemoryCliConfigStore({ services: [{ name: 'system', type: 'system' }] });
const bash = new Bash({ customCommands: [createWocliShellCommand({ config })] });
const result = await bash.exec('woctl system info --json | cat');
```

通用 xterm 组件从 `@wener/ui/terminal` 导出，按需加载终端和样式；Bash 与 woctl 只在演示 story 中装配。

- `@wener/common/cli`：公共通用 CLI，包含纯命令树、参数解析、help、输出渲染、命令行分词与显式宿主 runtime 类型；实现及正式回归位于 `packages/wener-common/src/cli`。
- `common/cli`：兼容 re-export；旧入口和深路径继续指向同一公共实现，`Cli`、`CliUsageError` 保持类身份一致。新增消费者应直接依赖 `@wener/common`。
- `common/context`：配置 schema、context 合并、store 接口和内存 store。
- `common/ai/prompt`：四协议请求准备、JSON/SSE 生成与取消处理；复用 GenerateMessage codec。
- `common/tui`：不依赖 Node 或 DOM 的 Markdown/结构化文本渲染。
- `common/service/cli`：`ServiceCliDefinition` 与共享 CLI builder；`prepare` 先验证参数，再获得 typed client。
- `common/service/runtime`：Provider registry、生命周期、只读检查；`common/service/runtime/client` 提供 HTTP transport 和 typed tool client。
- `src/createWocliCli.ts`：应用命令装配与执行宿主。
- `src/node/`：配置文件、Node I/O、环境变量与信号。
- `src/web.ts`：浏览器 SDK；`src/site/`：页面宿主。

新增业务服务时实现 `ServiceProvider`，注册到 `providers`，并用 `ServiceCliDefinition<S>` 声明 typed 命令。通过 `createWocliServiceCommand(definition, providerName)` 转为 `commands` 条目；同一条目可用于 Node 和 Web。Provider client 的 `close` 在每次命令结束时执行；注入的外部 runtime 由宿主关闭。

命令目录按本次有效 context 生成。只有配置且启用、当前宿主支持的服务才贡献领域命令；例如未配置 system 时，帮助中没有 `system`，直接执行也会拒绝。多实例共享同一组命令，通过 `--service` 或默认服务选择实例。`createWocliServiceCommand` 会自动附带 `serviceProvider` 元数据，命令名和 provider 名可以不同；未标记的宿主本地扩展始终保留。

SDK 的命令发现为异步接口，可作为补全或菜单的数据源：

```ts
const commands = await cli.describe({ context: 'dev' });
const selected = await cli.describe({ argv: ['--context', 'dev', '--help'] });
```

每次 `describe` 或执行都会重新读取配置；一次执行内，命令树与调用复用同一份快照。切换 context、增删服务或外部修改文件后，下次调用会刷新。命令发现不创建客户端、不解析实际密钥、不请求远端 schema。配置管理、render/markdown 和 prompt 本地子命令始终保留；prompt 生成使用现有 AI providers 配置，未配置 provider 时没有根生成入口。

通用 CLI 可独立从 `@wener/common/cli` 使用；渲染入口为 `@wener/common/cli/render`，原有按文件划分的深路径也可导入。CLI 不加入 `@wener/common` 根 barrel，不依赖 `common` 或 woctl。context、service policy、prompt 和 Markdown/TUI 的应用实现仍由上述应用共享入口维护。

## 验证

```sh
node node_modules/typescript/bin/tsc --noEmit -p apps/wocli/tsconfig.json
(cd apps/wocli && node ../../node_modules/vitest/vitest.mjs run --root . --config vitest.config.ts)
(cd packages/wener-common && node ../../node_modules/vitest/vitest.mjs run --root . --config ../../apps/wocli/vitest.config.ts src/cli)
(cd packages/common && node ../../node_modules/vitest/vitest.mjs run --root . --config ../../apps/wocli/vitest.config.ts src/cli/compatibility.test.ts src/service/cli/createServiceCliCommand.test.ts src/tui/render.test.ts)
```

以上命令从仓库根目录开始，仅使用已安装工具；缺少依赖时不隐式安装。通用 CLI 正式回归位于新 owner，旧包保留类身份与深路径兼容回归；共享测试显式使用 wocli 配置，避免默认配置加载本机环境文件。应用测试包含 browser bundle 的 VM 执行；VM 不提供 `process`、`Buffer` 或 `require`，并检查 bundle 没有引入 Node provider/ORM/Commander。
