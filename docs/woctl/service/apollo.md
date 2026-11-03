# Apollo

Apollo service 同步自 wcli 的 service 核心，提供 ConfigService、Portal 和 Admin OpenAPI 三类端点，以及 release 和 namespace 文档操作。底层 ConfigService 读取复用 `@wener/client/apolloconfig`。

```yaml
services:
  - name: settings
    type: apollo
    readOnly: true
    options:
      appId: sample
      env: DEV
      cluster: default
      namespace: application
      config:
        baseUrl: env://APOLLO_CONFIG_URL
      admin:
        baseUrl: env://APOLLO_ADMIN_URL
        auth:
          type: token
          token: env://APOLLO_ADMIN_TOKEN
      portal:
        baseUrl: env://APOLLO_PORTAL_URL
        auth:
          type: basic
          username: env://APOLLO_USERNAME
          password: env://APOLLO_PASSWORD
```

三个端点显式配置。ConfigService 可以设置 `auth: {type: app-secret, appSecret: env://APOLLO_APP_SECRET}`。外层 `readOnly` 控制业务写权限，不能用 `options.readOnly` 覆盖。`operator` 是 Admin OpenAPI 的操作人，与 Portal 登录身份分开。

```sh
woctl svc type info apollo --json
woctl svc schema settings --json
woctl apollo --service settings read --read-format json
woctl apollo --service settings status
woctl apollo --service settings portal apps
woctl apollo --service settings portal namespaces
woctl apollo --service settings portal items --namespace application
woctl apollo --service settings release list
woctl apollo --service settings release pending
woctl apollo --service settings admin list-app
woctl apollo --service settings admin list-item --input '{"size":20}'
```

`--input` 接受 JSON、`@file` 或 `-`；`--namespace`、`--cluster`、`--app-id`、`--env` 和 `--operator` 覆盖输入中的对应字段。`--read-format` 选择 Apollo 内容格式，与通用 CLI `--format` 字段投影分开。

写操作必须将 service 配置为 `readOnly: false` 并带 `--yes`。CLI 在读取文件、解析凭据或连接前检查权限与确认。支持预览的写操作可用 `--dry-run`，仍要求上述显式准入；不支持预览的操作会拒绝该选项。

```sh
woctl apollo --service settings namespace patch --input @patch.json --dry-run --yes
woctl apollo --service settings namespace write --input @namespace.json --dry-run --yes
woctl apollo --service settings item patch --input @items.json --dry-run --yes
woctl apollo --service settings release publish --input @release.json --dry-run --yes
```

发布保留源端的 Portal 权限检查、待发布草稿检查和 `ifMatch` 指纹检查。HTTP 响应丢失后不会将不确定的 mutation 伪装为成功。默认输出对配置敏感字段和凭据形态做脱敏。

`svc schema` 暴露全部 47 个操作及输入 schema；CLI 覆盖 read/status、portal、release、namespace、item 和 admin 分组，操作参数以 schema 为准。SDK 保留源数据供宿主使用；通用 service call 与 Apollo CLI 在输出边界脱敏。

离线验证覆盖核心操作、diff、JSON/YAML 文档 patch、HTTP 错误/脱敏、发布保护、只读策略和 CLI/runtime 接线。此次没有向真实 Apollo 服务发送写请求。
