# AI router

`@wener/client/ai/router` 提供基于 Hono 的 Fetch 应用，可以挂载到已有 Hono 服务，也可以直接将 `app.fetch` 交给 SDK 的自定义 fetch。

```ts
import { createAiRouter, createAiRouterFetch } from '@wener/client/ai/router';
import { ApiType } from '@wener/client/api/schema';

const app = createAiRouter({
	resolve: ({ model }) => ({
		api: ApiType.OpenAIResponses,
		baseURL: 'http://localhost:8080',
		model,
	}),
});

const sdkFetch = createAiRouterFetch(app);
```

`resolve` 负责模型、上游协议与凭据选择；`baseURL` 是上游 API 根地址，可含部署前缀。传入的客户端凭据不会自动转发，使用 `headers` 显式配置上游凭据。

四种消息生成协议通过 GenerateMessage adapter 进行请求、响应、流和错误转换：Chat Completions、Responses、Anthropic Messages、Gemini GenerateContent。`processors` 直接复用 adapter 的 request、part、response、stream 和 diagnostic hooks。Anthropic 必需的 `max_tokens` 由调用方传入，或显式使用 `defaultRequestProcessor` 配置。

原生接口支持 embeddings、rerank、images/generations、images/edits、audio/speech、audio/transcriptions、systemone。这些接口保留原生 JSON、multipart、二进制及 provider 扩展，要求上游与客户端协议相同。图片 embedding 的输入形式由上游决定。

`onRequest` 在 adapter 创建后、转换前执行，可以检查 exchange context 或返回 Response 短路。`onResponse` 可以处理最终响应；流式响应在读取 body 时才转换。`onError` 观察传输及转换失败，流开始前可以返回 Response，开始后使用协议内错误事件通知客户端。

## 测试

在 `packages/wener-client` 执行：

```sh
pnpm --config.verifyDepsBeforeRun=false run test:ai-router:offline
pnpm --config.verifyDepsBeforeRun=false run test:ai-router
pnpm --config.verifyDepsBeforeRun=false exec tsc --noEmit -p tests/ai-router/tsconfig.json
```

离线测试包含 HTTP 生命周期、真实 Vercel AI SDK 客户端的 4×4 协议矩阵，以及原生 JSON/multipart/binary 转发。SDK 的自定义 fetch 调用 Hono `app.fetch(new Request(input, init))`，无需监听端口；上游由测试中的确定性服务替代。

上述命令假定依赖已安装。`verifyDepsBeforeRun=false` 避免 pnpm 12 在执行测试前自动安装或重建工作区依赖，让离线测试仅运行测试本身。

真实测试从 `.env.test.local` 或进程环境读取配置。没有相应配置时只跳过对应能力；配置存在时实际请求上游，失败会报告为失败。测试配置包含以下变量，具体模型与地址由本地使用者填写：

| 变量 | 用途 |
| --- | --- |
| `TESTING_AI_BASE_URL` | LLM 服务 API 根地址 |
| `TESTING_AI_MODEL_CHAT` | Chat 模型 |
| `TESTING_AI_MODEL_RESPONSES` | Responses 模型 |
| `TESTING_AI_MODEL_GEMINI` | Gemini 模型 |
| `TESTING_AI_API_KEY` | 可选 LLM 服务凭据 |
| `TESTING_NATIVE_BASE_URL` | 原生能力服务 API 根地址 |
| `TESTING_EMBEDDING_MODEL` | 文本及图片 embedding 模型 |
| `TESTING_RERANK_MODEL` | rerank 模型 |
| `TESTING_IMAGE_MODEL` | 图片生成及编辑模型 |
| `TESTING_TTS_MODEL` | 语音合成模型 |
| `TESTING_STT_MODEL` | 语音识别模型 |
| `TESTING_DECISION_MODEL` | System One 分类模型 |
| `TESTING_NATIVE_API_KEY` | 可选原生服务凭据 |
| `TESTING_EMBEDDING_MEDIA_MARKER` | 可选图片 embedding marker，缺省从模型元数据读取 |
| `TESTING_STT_AUDIO_FILE` | 可选 STT WAV 文件，缺省使用 TTS 生成的测试音频 |
| `TESTING_PI_BIN` | 可选 Pi 可执行文件，缺省使用 PATH 中的 `pi` |

本地配置文件与生成的媒体不纳入源码提交。真实模型可能需要冷启动，原生测试按顺序执行，避免同时加载多个模型。

## Pi

`tests/ai-router/pi-models.ts` 的 `createPiRouterModels(baseURL)` 生成单 provider、四协议的 `models.json`。使用不同别名 `router-chat`、`router-responses`、`router-messages`、`router-gemini`，每模型覆盖 `api` 与必要的 `baseUrl`。服务端 resolver 将别名映射为配置的真实模型。

`pi-models.test.ts` 使用临时 agent 目录，让真实 Pi CLI 加载配置并列出四个别名。`pi-live.test.ts` 在配置存在时启动仅限测试生命周期的本地 Hono HTTP 服务，用真实 Pi 子进程逐协议完成流式请求；测试结束关闭服务并清理临时配置。原有 Pi agent 目录与默认模型配置不受影响。没有 Pi CLI 时仅跳过 Pi 测试，Vercel AI SDK 测试仍可独立运行。

Pi print 模式会读取管道 stdin 后再发请求；自动化调用必须关闭未使用的 stdin。当前测试在启动子进程后立即 `child.stdin.end()`，避免将输入等待误判为上游超时。

原生 live 验收验证向量维度与有限数、rerank 相关性、有效 PNG、WAV 数据和非空转写。图片编辑还检查输出与上传文件不同；这些检查不构成视觉语义评分或逐字语音识别准确率评测。VoxCPM2 请求显式携带 `options.retry_badcase=false`，属于该 provider 的测试参数，router 不替调用方注入此选项。
