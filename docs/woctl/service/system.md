# system 离线服务

system 是 woctl 本地注册的诊断服务，提供 info 和 echo，用来检查 context、服务选择与 schema/call 链路。它不需要网络、数据库或凭据。

## 配置与命令树

`woctl.yaml`：

```yaml
services:
  - name: local-system
    type: system
defaults:
  services:
    system: local-system
```

```text
system
  info
  echo <text>
```

```sh
woctl --config ./woctl.yaml system --help
woctl --config ./woctl.yaml system --list-services --json
woctl --config ./woctl.yaml system echo --help
woctl --config ./woctl.yaml system info --service local-system --json
woctl --config ./woctl.yaml system echo 'Hello' --service local-system --json
```

没有 shortalias、list/ls、show 或 query 子命令。多个 system 服务用 `--service` 或 `service default set system local-system` 选择；没有默认值且候选不唯一会失败。`-c dev` 切换合并配置，`--list-services` 只用于根命令，不连接服务。配置格式见 [配置](../configuration.md)。

## 通用调用与文件输出

```sh
woctl service inspect local-system --json
woctl service schema local-system --json
woctl service call local-system info --input '{}' --json
woctl service call local-system echo --input '{"text":"Hello"}' --json
woctl service call local-system echo --input @echo.json --output yaml
printf '{"text":"Hello"}' | woctl service call local-system echo --input - --json > echo-result.json
```

`echo.json` 为 `{"text":"Hello"}`。领域 echo 只接收位置字符串，不把 `@file` 当文件读取；文件 JSON 走 generic call，文本输入上限 16 MiB。info 返回 application/version 及宿主注入的 info；native 可带 node/platform/configPath，Web 带 runtime 等字段。结果依赖宿主，不承诺固定包含所有环境字段。echo 返回 `{ text }`。

普通输出使用 `--json` 或 `--output yaml/csv/...`；`--format` 是字段投影，不是文件路径，完整约定见 [命令约定](../patterns.md)。

## 只读、错误与宿主

两个工具都标记只读，不需要 `--yes`，也无需 writable。禁用服务仍被拒绝。服务选择/禁用/未知操作等 CLI 错误通常退出 2，echo 输入不是 string 时 provider 的普通异常通常退出 1；native 取消异常退出 130。

本地 system 在 Native、Web 都可使用，配置 store 及输出端口由宿主注入。它只返回显式 info，不提供任意进程执行或文件系统访问。若注入全局远程 runtime，调用可能由该 runtime 承接，此时不能把返回值视为本机环境。

实现：`apps/woctl/src/core.ts` 的 `SystemCliDefinition` 与 provider；选择链路在 `createWocliCli.ts`。离线行为用例在 `apps/woctl/src/wocli.test.ts`，应用测试通过。无外部服务验证要求；最终运行状态统一见 [覆盖表](../coverage.md)。
