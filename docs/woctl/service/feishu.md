# 飞书

`woctl feishu` 使用飞书应用的 tenant token，提供常见 IM/联系人操作与生成的 OpenAPI 目录。服务和主命令统一为 `feishu`，没有 `lark` 别名。

## 命令为什么没有出现在帮助里

woctl 根帮助按所选 context 中启用的服务显示领域命令。尚未配置飞书服务时，`woctl --help` 不列 `feishu`，但可直接运行 `woctl feishu` / `woctl feishu --help` 查看帮助和配置指引。实际调用缺少连接时会提示 `No enabled feishu service is configured`。也可以用静态目录检查当前版本是否包含实现：

```sh
woctl catalog --output md
woctl service providers --json
woctl service list --json
```

静态 catalog 包含所有已注册命令，不需要配置服务或凭据。如果 catalog 已有 `feishu`，添加连接即可；如果没有，先更新安装包或重建本地 CLI。

```sh
woctl service add feishu --type feishu --option appIdEnv=FEISHU_APP_ID --option appSecretEnv=FEISHU_APP_SECRET
woctl feishu --help
woctl feishu api list --api-service im --risk read --json
woctl feishu api describe im.chats.get --json
```

后两条只读取本地 API 目录，不需要环境变量中的值。旧配置的 `type: lark` 需要改成 `type: feishu`。

仓库内提供了同时启用飞书和 Telegram 命令的只读本地开发样例：

```sh
# From the repository root, using the installed workspace dependencies:
node --import tsx apps/woctl/src/cli/main.ts --config apps/woctl/examples/woctl.services.yaml feishu --help
node --import tsx apps/woctl/src/cli/main.ts --config apps/woctl/examples/woctl.services.yaml tg --help
node --import tsx apps/woctl/src/cli/main.ts --config apps/woctl/examples/woctl.services.yaml feishu api list --risk read --json
```

样例只包含环境变量名称，不读取或修改现有个人配置。实际请求前，将 `FEISHU_APP_ID` 和 `FEISHU_APP_SECRET` 设置为飞书应用凭据，并为应用授予相应 API 权限。

## 常用调用

```sh
woctl feishu chat list --json
woctl feishu chat get CHAT_ID --json
woctl feishu chat members CHAT_ID --json
woctl feishu user get USER_ID --id-type open_id --json
woctl feishu message list --chat CHAT_ID --json
woctl feishu message get MESSAGE_ID --json
woctl feishu api call im.chats.get --path chat_id=CHAT_ID --json
```

写操作要求服务设置 `readOnly: false`，同时传 `--yes`。对 high-risk-write 目录 API 还需 `--confirm-high-risk`。`--dry-run` 校验并构造目录 API 请求，不读取凭据或发送请求；可在只读服务上预览写操作。

```sh
woctl feishu api call im.messages.delete --path message_id=MESSAGE_ID --dry-run --json
woctl feishu send --to OPEN_ID --text 'Hello' --yes
woctl feishu message reply MESSAGE_ID --text 'Received' --yes
woctl feishu api request GET im/v1/chats --yes --json
```

原始 `api request` 保守地按写操作保护。只读目录调用走 `callReadApi`，写调用走 `callWriteApi`。目录覆盖 14 个业务域、225 个 API；只支持 user token 的 API 与 multipart API 会明确拒绝，文件上传使用 `file upload` 快捷命令。完整参数见 [命令参考](../reference.md)。

真实应用权限、网络和飞书租户数据需要在目标环境验证；本地 fixtures 和目录测试不代表真实租户调用已验证。
