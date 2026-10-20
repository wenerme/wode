# wocli

Wode 的命令宿主。Node CLI、可嵌入的 Web SDK 和静态网页共用命令定义、context 和 service 调用链。

## 运行与构建

从仓库根目录执行：

```sh
pnpm --filter wocli dev --help
pnpm --filter wocli dev service add system --provider system
pnpm --filter wocli dev system info --json
pnpm --filter wocli dev system echo 'Hello, Wener' --json
pnpm --filter wocli dev:web

pnpm --filter wocli build
node apps/wocli/dist/cli.js --help
pnpm --filter wocli preview
```

构建产物：

| 文件 | 用途 |
| --- | --- |
| `dist/cli.js` | Node 24+ CLI，可直接执行 |
| `dist/web.js` | 浏览器 ESM SDK，包含依赖 |
| `dist/shell.js` | just-bash 自定义命令适配器，调用相同 Web SDK |
| `dist/site/` | 可部署在任意静态服务器的页面，支持子路径 |

Web SDK 和静态页面均无需 Node polyfill。页面直接在浏览器执行命令，默认将配置保存在当前 origin 的 localStorage。SDK 默认只使用内存 store；远端服务仍需 HTTP 可达，并允许页面 origin 的 CORS 请求。

## Context 与服务

```sh
wocli context list
wocli context create dev
wocli context use dev
wocli context show --json
wocli service list --context local --json
wocli service providers
wocli service default show --json
wocli service inspect system

wocli service add gateway --provider http --url https://example.com/api --id remote-service
wocli service schema gateway --json
wocli service call gateway operation --input '{"key":"value"}' --json
wocli service call system echo --input @input.json --json
printf '{"text":"stdin"}' | wocli service call system echo --input - --json
```

Node 使用 base 与一个选中 context 文件。base 默认是 `~/.wode/wocli.yaml`，context 是同目录的 `wocli.CONTEXT.yaml`。`--config <path>` 优先于 `WOCLI_CONFIG`；自定义 `config.yml` 对应 `config.CONTEXT.yml`，只支持 `.yaml`/`.yml`。选择顺序为 `--context/-c`、`WOCLI_CONTEXT`、base `currentContext`、`local`，临时选择不改变持久默认值。

缺失 base 返回空 globals；缺失 local 文件使用 base-only 配置。选中其他 context 时文件必须存在。读取仅打开 base 和选中 overlay，其他 context 只枚举文件名；不会自动创建文件或注入 system 服务。可用 `service add system --provider system` 显式添加。

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

独立的 `wocli.dev.yaml` 示例：

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

扩展字段在解析和保存时保留。读取和帮助不会重写文件；显式保存输出 canonical 数组，YAML 注释和排版不保留。Browser/memory store 使用内部 aggregate 视图；动态命令目录留待 WOC-005。

HTTP provider 对接与参考 wcli 一致的接口：`GET /service/{service}/schema` 和 `POST /service/{service}/call`，调用 body 为 `{ toolName, input }`。Schema 的 `tools` 是以工具名为 key 的对象，工具包含 `inputSchema` 与可选 `annotations.readOnlyHint`。默认只允许标记为只读的工具；配置 `readOnly: false` 或添加服务时使用 `--writable` 才允许写工具。服务端负责认证、可见性和最终授权。

`service default set <provider> <service>` 修改所选 context 的默认服务；`unset <provider>` 移除该 context 的覆盖，继续继承根 defaults。`service inspect` 默认列出只读工具、必填输入和调用模板，`--writable` 展示全部工具，`--json` 返回原始 schema。

## Render 与 Markdown

```sh
wocli render README.md --no-color
wocli markdown --text '# Hello'
cat input.json | wocli render - --input json --format yaml
wocli render input.json --format table
wocli render article.md --format text -o article.txt
```

按文件名识别 Markdown、JSON、JSONL、YAML 和代码；stdin 可用 `--input` 指定类型。`markdown` 的别名是 `md`。Markdown 支持 GFM 表格、列表和代码块；默认按宿主 TTY 决定 ANSI 样式。`-o/--output` 是输出文件，`-f/--format` 选择渲染格式。Web SDK 读取或写入文件需要宿主提供 `readText/writeText`，just-bash 使用虚拟文件系统。

## Provider、Model 与 Prompt

```sh
wocli provider types
wocli provider add example --api openai --url https://example.com/v1
wocli model add fast --provider example --id upstream-model --max-output-tokens 1024
wocli model use example/fast
wocli provider list --json
wocli model list --json
wocli prompt 'Hello' --dump
wocli prompt 'Hello' --stream
wocli prompt 'Hello' --json

wocli prompt import summarize --text 'Summarize {{text}}'
wocli prompt render summarize --var text=article
wocli prompt @summarize --var text=article
```

AI provider 与 model 按 context 配置，model 使用 `provider/name` 标识，`model use` 设置默认值；`context provider` 与 `context model` 也提供同样的目录命令。模型协议支持 `openai`、`openai-response`、`anthropic` 和 `gemini`，共用 GenerateMessage codec。Anthropic 需要配置 `max-output-tokens`。认证可使用 provider 的 `apiKey` 或 `headers`，Node 宿主支持 `apiKeyEnv: VARIABLE_NAME`（CLI 使用 `--api-key-env VARIABLE_NAME`）；浏览器由宿主显式注入环境映射。目录与 context 展示会隐藏认证值、headers 和 URL query。

`prompt` 的别名是 `p`，支持 `--model`、`--system`、`--stream`、`--json`、`--jsonschema` 和 `--var key=value`。`--dump` 仅输出脱敏请求，不发网络请求；模板 `list/show/import/remove/render` 均可离线使用，支持带 YAML frontmatter 的 dotprompt。`--stream --json` 聚合完整结果后输出 JSON；普通流式输出通过宿主 `io.write` 回调传递，未提供该回调时在完成后输出全文。浏览器跨域调用仍由目标 provider 的 CORS 策略决定。

`service providers`（兼容入口 `provider types`）列出服务插件；AI provider 用 `provider list` 查看。

## 嵌入 Web

```ts
import { createMemoryCliConfigStore, createWocliWebCli } from 'wocli/web';

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

打开 `Infrastructure / Shell / Wocli` 或 `Infrastructure / Shell / Bash`。Wocli story 将 `wocli` 注册为 just-bash 命令，支持管道、重定向、`--input @file` 和从 stdin 读取 JSON。每个 story 使用独立的内存配置和虚拟文件系统，不加载 Node 的本地配置。

适配器也可以独立使用：

```ts
import { Bash } from 'just-bash/browser';
import { createWocliShellCommand } from 'wocli/shell';
import { createMemoryCliConfigStore } from 'wocli/web';

const config = createMemoryCliConfigStore({ services: [{ name: 'system', type: 'system' }] });
const bash = new Bash({ customCommands: [createWocliShellCommand({ config })] });
const result = await bash.exec('wocli system info --json | cat');
```

通用 xterm 组件从 `@wener/ui/terminal` 导出，按需加载终端和样式；Bash 与 wocli 只在演示 story 中装配。

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

通用 CLI 可独立从 `@wener/common/cli` 使用；渲染入口为 `@wener/common/cli/render`，原有按文件划分的深路径也可导入。CLI 不加入 `@wener/common` 根 barrel，不依赖 `common` 或 wocli。context、service policy、prompt 和 Markdown/TUI 的应用实现仍由上述应用共享入口维护。

## 验证

```sh
node node_modules/typescript/bin/tsc --noEmit -p apps/wocli/tsconfig.json
(cd apps/wocli && node ../../node_modules/vitest/vitest.mjs run --root . --config vitest.config.ts)
(cd packages/wener-common && node ../../node_modules/vitest/vitest.mjs run --root . --config ../../apps/wocli/vitest.config.ts src/cli)
(cd packages/common && node ../../node_modules/vitest/vitest.mjs run --root . --config ../../apps/wocli/vitest.config.ts src/cli/compatibility.test.ts src/service/cli/createServiceCliCommand.test.ts src/tui/render.test.ts)
```

以上命令从仓库根目录开始，仅使用已安装工具；缺少依赖时不隐式安装。通用 CLI 正式回归位于新 owner，旧包保留类身份与深路径兼容回归；共享测试显式使用 wocli 配置，避免默认配置加载本机环境文件。应用测试包含 browser bundle 的 VM 执行；VM 不提供 `process`、`Buffer` 或 `require`，并检查 bundle 没有引入 Node provider/ORM/Commander。
