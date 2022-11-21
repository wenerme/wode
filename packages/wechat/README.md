# 微信 SDK

- 客户端 - `@wener/wechat`
  - TS 定义
- 服务端 - `@wener/wechat/server`
  - 维护 Token
  - [ ] 维护 AuthToken - 用户授权后获取到的 Token
- 服务 - `@wener/wechat/service`
  - 检测 环境变量自动配置
  - 支持 proxy 配置
  - 持久 Token 到 DB
  - [ ] 持久 AuthToken 到 DB

## 服务端开发 {#sevrer-side}

```ts
import { createWechatServerClientFromEnv } from '@wener/wechat/service'

const client = createWechatServerClientFromEnv()

// 获取 Token
console.log(await client.accessToken())
```
