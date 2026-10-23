# AI 模型与 prompt

AI 配置由 providers、provider.models、defaultModel、prompts 组成，与 `services/defaults.services` 独立。当前 woctl 主要提供文本消息生成，协议包括 OpenAI Chat Completions、OpenAI Responses、Anthropic、Gemini；模型目录里的其他 capability 不代表都已有 CLI 命令。

## 配置与模型选择

示例 `woctl.yaml` 使用占位端点和假的环境变量引用：

```yaml
services: []
defaults:
  services: {}
providers:
  example-ai:
    api: openai
    baseUrl: https://ai.example.test/v1
    apiKeyEnv: DOCS_AI_KEY
    models:
      chat:
        name: example-chat-model
        maxOutputTokens: 1024
defaultModel: example-ai/chat
prompts:
  summarize:
    template: '总结：{{text}}'
    model: example-ai/chat
```

端点、模型 ID 和变量引用需替换为自己授权的服务。apiKeyEnv 由 native 宿主 getEnv 读取；普通 headers 不做插值。Web 必须注入凭据/生成端口，不能自动读取进程环境。

```sh
woctl --config ./woctl.yaml provider list --json
woctl --config ./woctl.yaml model show example-ai/chat --json
woctl --config ./woctl.yaml prompt '说明参数绑定' --model example-ai/chat --dump
```

dump 只生成脱敏请求，不调用模型，也不要求实际 key；它不证明上游 URL、模型及凭据可用。`--model` 优先于 preset model，再使用 context defaultModel；`--provider` 可限制 provider，协议可用 `--protocol` 覆盖。短模型名可能歧义，脚本推荐 `provider/model`。没有使用 `--service` 或 `--list-services` 的 AI 选择方式。context 切换和 providers 同名覆盖见 [配置](../configuration.md)。

## 实际命令树

```text
provider
  list / ls             --search
  show <name>
  add <name>            --api --url --title --api-key-env --input
  remove <name>
  types
model
  list / ls             --provider --search
  show <model>
  add <name>            --provider --id --title --max-output-tokens --context-size --temperature
  use <model>
  remove <model>
prompt / p [text...]
  list / ls
  show <name>
  import <name> [source] --text
  remove <name>
  render <name>         --var --input
```

provider/model 命令也可放在 `context/ctx` 下，例如 `woctl context model list`。`provider types` 列的是 service provider 插件，不是 AI 协议清单。

```sh
woctl provider add example-ai --api openai --url https://ai.example.test/v1 --api-key-env DOCS_AI_KEY
woctl model add chat --provider example-ai --id example-chat-model --max-output-tokens 1024
woctl model use example-ai/chat
woctl prompt --help
woctl prompt render --help
```

这些配置命令保存至所选 context，不需 `--yes`，也不会验证真实服务。删除当前默认模型或它的 provider 会被拒绝，应先换默认模型。没有配置 provider 时保留 prompt 本地管理和 render，生成入口会隐藏。

## 内容、模板与文件

```sh
woctl prompt import summarize --text '总结：{{text}}'
woctl prompt render summarize --var 'text=一篇示例文章'
woctl prompt render summarize --var text=@article.txt --json
woctl prompt @summarize --var text=@article.txt --model example-ai/chat --dump
woctl prompt import review ./review.prompt.md
```

import 支持 YAML frontmatter 和正文，source 也支持 stdin；preset 可以按名字读取，找不到时尝试文件。生成的第一个 `@name` 先选择 preset 或模板文件；需要普通文本文件作为附加提示时用 `--prompt @article.txt`。`--var` 与 `--input` 均是可重复 name=value，不是整个请求 JSON；值可 `@文件` 或 `-`，读取后尝试 JSON.parse，失败保留字符串。

```sh
woctl prompt '分析下列文本' --prompt @article.txt --system @system.txt --model example-ai/chat --dump
printf '一段示例文本' | woctl prompt --model example-ai/chat --dump
woctl prompt '继续解释' --message 'assistant:先前回答' --message 'user:补充问题' --dump
```

附加 message 接受 user/assistant/system:content，内容也通过共同文本读取器处理。各次文件/文本读取上限 16 MiB，不表示整个请求总大小或模型上下文容量。模板 role 标记先解析，再插入变量。

## 真实调用、结构化与流式输出

以下需要已经替换占位端点、准备授权凭据及模型：

```sh
woctl prompt '解释参数绑定' --model example-ai/chat
woctl prompt '用 JSON 表示两个颜色' --json --model example-ai/chat --output json
woctl prompt '生成一个对象' --jsonschema @response.schema.json --model example-ai/chat --output json > generation.json
woctl prompt @summarize --var text=@article.txt --model example-ai/chat --stream --output text
```

`--json` 设置模型 responseFormat 为 JSON object；完整响应（text/model/usage 等）用 `--output json`。jsonl 输出完成后的摘要行，不是每个 token 的 JSONL。`--jsonschema` 必须读取为对象；上游是否支持由协议与模型决定，不能仅凭本地解析认定生成结果符合 schema。

生成输出支持 text/json/jsonl/md/markdown；不像普通数据命令支持所有 renderer。temperature 为 0..2，top-p 为 0..1，max-output-tokens 为正整数。Anthropic 要求本次选项、preset 或模型配置中有显式 maxOutputTokens；model add 本身不会替使用者补足。

`--stream/--no-stream` 是布尔选项，只有明确 --stream 才开启。Node text 输出且存在 write 端口时可逐块写出；其他模式等待完整结果。模型必须满足 message-generation 或 message-streaming 能力要求。基础 WebStream adapter 不代表已完成 drain/背压/abort 保证，见 [命令约定](../patterns.md)。

## 错误、权限与验证

生成可能产生费用，没有 SQL 风格的 `--yes` 或 service readOnly 门槛；dump/render 可以先离线核对。多数 CLI 参数/模型选择错误退出 2，schema 校验或 provider/网络异常可能退出 1，native 取消异常退出 130。配置目录命令输出会隐藏凭据，但使用者仍应避免把原始私有 prompt/response 当公共证据。

Native 支持环境变量和文件 stdin；Web 需注入 fetch、凭据与文件能力，并满足 CORS。通用远程 service runtime 不自动代理 prompt；AI 可使用独立 HTTP provider 或注入 generate。

定义：`apps/woctl/src/commands/ai-catalog.ts`、`prompt.ts`、`prompt-input.ts`；协议执行在 `packages/wener-client/src/ai/message-generation/`，模型 registry 在 `packages/wener-common/src/ai/model/`。离线测试源码见 `commands/ai.test.ts`、`packages/common/src/context/AiCatalog.test.ts`、`AiConfig.test.ts`、`packages/common/src/ai/prompt/execute.errors.test.ts`。CLI 测试通过，common AI 测试本轮未重跑，未实际调用 provider；最终运行状态统一见 [覆盖表](../coverage.md)。
