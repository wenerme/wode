# Linear

Linear uses the shared service registry and a browser-safe HTTP/GraphQL client. The migration retains all eleven operations from wcli: viewer, teams, workflow states, users, projects, issue listing and lookup, issue creation and updates, and comment listing and creation.

## Configure a service

Set `LINEAR_API_KEY` in the environment and configure a named service:

```yaml
version: 1
services:
  - name: work
    type: linear
    readOnly: true
    options:
      apiKeyEnv: LINEAR_API_KEY
defaults:
  services:
    linear: work
```

The default endpoint is `https://api.linear.app/graphql`. Override `baseUrl` on the service for an explicitly selected endpoint. Use either `apiKey`/`apiKeyEnv` or `accessToken`/`accessTokenEnv`. API keys are sent as the Authorization value; OAuth access tokens use Bearer authentication. Resolve credentials through the host environment port when a service is loaded.

```sh
woctl service type linear --typescript
woctl linear --list-services --json
woctl linear status --service work --json
woctl linear --help
```

The `linear` command appears when the selected context has an enabled Linear service. Complete static documentation remains available with `catalog --service-type linear`. Help and static discovery do not resolve credentials or connect to Linear.

## Read operations

```sh
woctl linear team ls --limit 25
woctl linear state ls --team TEAM_ID
woctl linear user ls --query Ada
woctl linear project ls --team TEAM_ID --query Launch
woctl linear issue ls --team TEAM_ID --assignee USER_ID --state STATE_ID
woctl linear issue ls --updated-after 2026-01-01T00:00:00Z --query regression
woctl linear issue ls --filter '{"priority":{"eq":1}}' --json
woctl linear issue ls --filter @filter.json --json
woctl linear issue get EX-123 --json --output-file issue.json
woctl linear comment ls EX-123 --limit 25
```

`list` and `ls` are aliases. Connection results retain `nodes` and `pageInfo` in JSON. Pagination uses `--limit` from 1 through 100 and `--after` with the previous `endCursor`; listing does not silently fetch every page. Teams, users, projects and issues support `--include-archived`. Table output is a projection of the complete response.

For issues, `--team`, `--assignee`, `--project`, `--state`, `--query` and `--updated-after` can be combined with a Linear IssueFilter object. JSON filters and description/comment input support `@file`; stdin is available through the host's text-input port. Text and filter input are limited to 100,000 UTF-8 bytes.

## Write operations

Set `readOnly: false` on the selected service and explicitly pass `--yes`:

```sh
woctl linear issue create 'Fix regression' --team TEAM_ID --description @body.md --yes
woctl linear issue update EX-123 --state STATE_ID --assignee USER_ID --priority 1 --yes
woctl linear issue update EX-123 --clear-assignee --clear-project --clear-due-date --yes
woctl linear comment create EX-123 @comment.md --yes
```

Issue fields include description, state, assignee, project, priority from 0 through 4, due date in `YYYY-MM-DD`, and repeatable `--label`. A clear flag conflicts with assigning the same field. The read-only and confirmation checks precede file input, credential resolution, client creation and HTTP requests. Generic `service call` enforces the same write policy.

Use `--output-file` for a formatted result; `--output-file -` keeps stdout. A host without file output rejects an explicit file destination before executing the operation. File output does not change service write permissions.

## Reuse in another application

The public package entries are:

- `@wener/client/linear`: HTTP adapter, GraphQL documents, connection schema, DTOs and errors.
- `@wener/common/service/linear`: service interface and implementation, configuration, schemas, contract and typed operations.
- `@wener/common/service/linear/client`: tool-transport client.
- `@wener/common/service/linear/cli`: command definition and CLI binding.
- `@wener/common/service/providers/linear`: provider definition.

The service accepts an injected adapter; the HTTP adapter accepts injected fetch and retry sleep. Calls support cancellation, request timeout and response-size limits. Retryable read requests have a bounded retry budget; mutations are never automatically replayed. Closing the adapter cancels and waits for active operations. Provider registration and contract discovery are static.

Private YAML selection, private environment conventions and private output policies remain in the consuming application. A linked wcli can use [the Node workspace host entry](../development.md#link-a-private-node-host) and append its private commands, providers and bindings while keeping the public Linear implementation here.

Validation uses source-derived fixtures and local mocks. It does not establish access to a real Linear workspace or permission to mutate one.
