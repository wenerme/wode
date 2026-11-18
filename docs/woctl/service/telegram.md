# Telegram Bot

`woctl telegram` 的短别名是 `woctl tg`。这个服务使用 Telegram Bot API 和 bot token，不包含个人账号的 MTProto 登录。

## 临时连接

通过 `--token` 在当前调用创建临时服务，无需先添加连接：

```sh
woctl tg --token "$TOKEN" whoami --json
woctl tg --token "$TOKEN" send --chat 123456789 --text 'Hello' --yes
woctl tg chat get @example_channel --token "$TOKEN" --json
woctl tg --token "$TOKEN" --list-services --json
```

临时服务默认名是 canonical type `telegram`，会自动选中；`--service session-bot` 可指定临时名称。显式 `--token` 优先于本次调用的已保存连接和默认值，同名配置保持原样。临时连接可写，写操作仍需 `--yes`；加 `--read-only` 可限制为只读。

```sh
woctl tg --token "$TOKEN" --service session-bot whoami --json
woctl tg --token "$TOKEN" --read-only whoami --json
```

token 只保存在本次调用的内存中，不保存配置、不修改环境变量，也不出现在发现和诊断输出里。不传 `--token` 时使用正常的配置选择顺序：显式 `--service`、配置的默认连接、名为 `telegram` 的启用实例、其他候选实例。

## 配置

将 BotFather 发放的 token 放入 `TELEGRAM_BOT_TOKEN` 环境变量，然后配置服务：

```sh
woctl service add bot --type telegram --option botTokenEnv=TELEGRAM_BOT_TOKEN
woctl telegram whoami --service bot --json
woctl tg --list-services --json
```

`whoami` 的兼容命令是 `status`。未配置连接时也可运行 `woctl tg` / `woctl tg --help` 查看帮助和配置指引；根帮助在所选 context 有启用的 `telegram` 服务后才列出该命令。`woctl catalog --output md` 可以离线查看完整命令目录。

使用已保存连接发送消息、编辑消息、配置 webhook 和获取 updates 都需要服务设置 `readOnly: false`，并且每次 CLI 调用带 `--yes`。创建可写连接的示例：

```sh
woctl service add writable-bot --type telegram --writable --option botTokenEnv=TELEGRAM_BOT_TOKEN
```

也可以直接使用配置文件：

```yaml
version: 1
currentContext: local
services:
  - name: bot
    type: telegram
    readOnly: false
    options:
      botTokenEnv: TELEGRAM_BOT_TOKEN
      timeoutMs: 60000
defaults:
  services:
    telegram: bot
```

token 只在经过参数校验与读写准入之后解析。帮助、目录、schema 和失败的参数校验不会读取 token 或联网。多个连接时使用 `--service bot`，或设置 `woctl service default set telegram bot`。

## 消息与聊天

```sh
woctl tg send --chat 123456789 --text 'Hello' --yes --json
woctl tg send --chat @example_channel --text @message.txt --parse-mode HTML --yes
woctl tg send --chat 123456789 --text 'Reply' --reply-to 42 --silent --yes
woctl tg message edit --chat 123456789 --message 42 --text 'Updated' --yes
woctl tg message delete --chat 123456789 --message 42 --yes
woctl tg message forward --from-chat 123456789 --chat 987654321 --message 42 --yes
woctl tg message copy --from-chat 123456789 --chat 987654321 --message 42 --yes
woctl tg message pin --chat 123456789 --message 42 --silent --yes
woctl tg message unpin --chat 123456789 --message 42 --yes
woctl tg chat get @example_channel --json
woctl tg chat member @example_channel --user 123456789 --json
woctl tg chat admins @example_channel --json
woctl tg chat count @example_channel --json
```

文本支持原文、`@file` 和 `-` stdin。文本中的前后空格保留。消息与聊天操作仍受 Telegram 的机器人权限、聊天类型及消息编辑/删除时限限制。Bot API 没有任意聊天的历史消息查询接口；`updates` 获取的是机器人收到的待处理更新。

## 图片与文件

```sh
woctl tg send-photo --chat 123456789 --file ./photo.jpg --caption 'A photo' --yes
woctl tg send-document --chat 123456789 --file ./report.pdf --yes
woctl tg send-document --chat 123456789 --source TELEGRAM_FILE_ID --yes
woctl tg send-photo --chat 123456789 --source https://example.com/photo.jpg --yes
woctl tg file info TELEGRAM_FILE_ID --json
woctl tg file download documents/file.pdf --out ./report.pdf --json
woctl tg file download documents/file.pdf --json
```

`--file` 通过宿主二进制端口读取，支持路径、`@file` 和 `-`；stdin 上传需要 `--name` 指定文件名。`--source` 接受已存在的 file id 或 HTTPS URL，由 Telegram 获取 URL 内容。`--file` 与 `--source` 互斥。本地上传图片上限 10 MiB，文档与下载上限 20 MiB；这些是当前实现的传输限制。

下载参数是 `file info` 返回的 `result.file_path`。`--out` 将原始字节写入文件，结果中保留 metadata；省略 `--out` 并使用 `--json` 时，返回 Base64。文件路径严格限制在 Telegram 文件 API 下，不返回含 token 的下载 URL。

## Updates 与 webhook

```sh
woctl tg webhook info --json
woctl tg webhook set https://example.com/telegram --secret-token @webhook-secret.txt --yes
woctl tg webhook delete --yes
woctl tg updates --limit 20 --timeout 20 --yes --json
woctl tg updates --offset 1001 --allowed-update message --allowed-update callback_query --yes --json
woctl tg callback answer CALLBACK_QUERY_ID --text 'Done' --yes
```

每次 `updates` 调用只读取一批，不启动后台轮询。使用 webhook 时不能同时调用 `getUpdates`；切换轮询前先删除 webhook。把上一批最大 `update_id + 1` 作为下一次 `--offset` 会确认更早的更新，负 offset 会丢弃更早的队列数据，因此 typed 和 raw `getUpdates` 都按写操作保护。

长轮询的 `--timeout` 单位为秒，范围 0..50；服务的 `options.timeoutMs` 应大于等待时间并为网络留余量。webhook 的 `--drop-pending` 会丢弃待处理更新，只在明确需要时使用。webhook secret 用于接收端验证 `X-Telegram-Bot-Api-Secret-Token`；本服务只配置 webhook，不启动 HTTP 接收服务器。

## 机器人命令和原始 API

```sh
woctl tg commands get --json
woctl tg commands set --data '[{"command":"start","description":"Start the bot"}]' --yes
woctl tg commands set --data @commands.json --language en --yes
woctl tg commands delete --yes
woctl tg api getChat --params chat_id=@example_channel --json
woctl tg api sendMessage --params chat_id=123456789 --params text=Hello --yes --json
woctl tg api sendMessage --params chat_id=123456789 --params text=Hello --params 'reply_markup=json:{"inline_keyboard":[]}' --yes
```

原始 API 使用 Telegram 的 snake_case 参数名。默认值按字符串传递，`json:` 前缀可以传入数字、布尔值、数组和对象。参数仅支持内联 `key=value`；文件输入使用相应 typed 命令。只读方法使用白名单；未知方法默认为写操作。

JSON API 的 service 输出保留 `{ok: true, result: ...}`，`result` 中保留供应商字段；下载使用原生字节结果与单独的有界 Base64 wire 投影。API client 可独立从 `@wener/client/telegram` 使用，service 与 typed tool client 位于 `@wener/common/service/telegram` 及其 `client` 子入口。

验证使用 fetch fixtures、内存配置和宿主 I/O mock，不向真实 Telegram 账户发送消息。真实 token、BotFather 设置、群组权限和网络代理仍需在目标环境验证。
