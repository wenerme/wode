# Wode

Wode is Wener's TypeScript monorepo for React console surfaces, reusable UI primitives, service and API tooling, AI/MCP integrations, and protobuf contracts.

The name comes from **Wener nODE & DEMO**. The repository is organized as a pnpm workspace and uses Just for reusable task recipes and Vite+ (`vp`) for formatting and tests.

## Repository layout

| Path                                                                 | Responsibility                                                                                     |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `apps/components`                                                    | Waku component lab, Storybook catalog, and the shadcn-compatible Wode Registry.                    |
| `apps/console`                                                       | The application console and app-specific routes, modules, and foundation code.                     |
| `apps/server`                                                        | Server application entry points and API integrations.                                              |
| `packages/ui`                                                        | Application-agnostic React primitives built with Base UI and Tailwind CSS.                         |
| `packages/wener-console`                                             | Reusable console toolkit, layouts, resource views, loaders, and console integrations.              |
| `packages/wener-common`                                              | Shared filesystem, resource, schema, and server-independent utilities.                             |
| `packages/wener-server`                                              | Server helpers, entities, Hono/Nest integrations, ConnectRPC helpers, and NATS modules.            |
| `packages/wener-ai`                                                  | AI SDK utilities, agent contracts, and MCP server definitions.                                     |
| `packages/wener-client`                                              | Clients for external services and provider APIs.                                                   |
| `packages/wener-mcps`                                                | MCP server implementations and audit/runtime support.                                              |
| `packages/wener-mcp-cli`                                             | CLI for interacting with MCP servers.                                                              |
| `packages/wener-feishu-devdocs-mcp`                                  | Feishu/Lark developer documentation MCP server.                                                    |
| `packages/wener-mssql-mcp`                                           | Microsoft SQL Server MCP server.                                                                   |
| `packages/wener-api-cli`                                             | CLI for REST APIs described by OpenAPI specifications.                                             |
| `packages/wener-miniquery`                                           | Safe SQL-`WHERE`-like filter expressions for ORM queries.                                          |
| `packages/wener-utils`, `packages/wener-reaction`, `packages/system` | General utilities, React helpers, and SystemJS support.                                            |
| `proto`                                                              | Canonical protobuf source tree. Generated TypeScript is checked into the packages that consume it. |

Legacy experiments and the former standalone web/playground applications are not part of the tracked workspace. New demos belong in the component stories or in an application route with an explicit owner.

## Requirements

- Node.js `>=24.11.0`
- pnpm `10.33.0`
- Just `1.38.0` or newer
- Buf CLI for protobuf formatting, linting, and generation
- Chromium for the browser-based Storybook tests

The required package-manager and runtime versions are declared in the root `package.json`. Install pnpm with Corepack or through your preferred system package manager, then install dependencies:

```bash
corepack enable
pnpm install
```

For the Storybook browser suite, install Chromium once on the development machine:

```bash
pnpm exec playwright install --with-deps chromium
```

## Common commands

Run commands from the repository root unless a command includes `-C`.

| Command                          | Purpose                                                                                      |
| -------------------------------- | -------------------------------------------------------------------------------------------- |
| `just dev`                       | Start workspace development tasks in parallel through Turbo.                                 |
| `just build`                     | Build workspace packages and applications through Turbo.                                     |
| `just test`                      | Run workspace tests through Turbo.                                                           |
| `just fmt`                       | Format TypeScript, TSX, and Markdown with Vite+.                                             |
| `just lint`                      | Run the Vite+ lint entry point.                                                              |
| `just typecheck`                 | Run every package typecheck that defines one.                                                |
| `just buf-fmt` / `just buf-lint` | Format or lint the canonical protobuf tree.                                                  |
| `just buf-gen`                   | Generate protobuf clients and normalize generated output.                                    |
| `just ci`                        | Run the CI baseline: frozen install, protobuf checks, Biome, typechecks, and selected tests. |

Vite+ owns the repository's test and formatting workflow. New test files should import test APIs from `vite-plus/test` and run through `pnpm exec vp test run` or the package script that wraps it.

The root [`justfile`](justfile) imports reusable domain recipes from `just/*.just`. Recipes that operate in the caller's package use `[no-cd]`, so the same file can be reused without duplicating a Makefile in every package:

```bash
cd packages/wener-common
just -f ../../just/package.just package-fmt
just -f ../../just/package.just package-typecheck
just -f ../../just/packages/wener-common.just build
```

Package-specific build and publish behavior belongs in `just/packages/*.just`; workspace-wide orchestration belongs in `just/workspace.just`, `just/ci.just`, and the domain files for Proto, components, and server entrypoints.

## Components and Registry

`apps/components` is the source and delivery surface for reusable Wode console components. Its authored source is organized by domain under:

```text
apps/components/src/
├── agent/
├── auth/
├── components/
├── console/
├── file/
├── resource/
├── ui/
└── window/
```

The same source tree powers runtime usage, Storybook, and the generated flat Registry catalog. `apps/components/registry.json` and the domain manifests contain publishing metadata; generated files under `apps/components/public/r/` must be rebuilt rather than edited by hand.

Useful component commands:

```bash
pnpm -C apps/components dev
pnpm -C apps/components storybook
pnpm -C apps/components registry:build
pnpm -C apps/components registry:check
pnpm -C apps/components registry:consumer-check -- --all
pnpm -C apps/components verify
```

`verify` runs router and source checks, TypeScript, unit tests, browser Storybook tests, Story structure checks, Registry checks, clean consumer checks, the Waku build, and the Pages artifact check. See [`apps/components/README.md`](apps/components/README.md) for Registry ownership, dependency direction, and installation examples.

The public Registry uses flat addresses such as:

```text
https://ui-components.wener.me/r/console-shell.json
```

Consumers can install an item with shadcn:

```bash
npx shadcn add https://ui-components.wener.me/r/console-shell.json
```

`packages/ui` is the lower-level primitive package. It exposes independent subpaths such as `@wener/ui/button`, `@wener/ui/dialog`, and `@wener/ui/input`. It uses Base UI for stateful behavior and Tailwind CSS/DaisyUI-compatible classes for presentation. Its verification commands are:

```bash
pnpm -C packages/ui test
pnpm -C packages/ui typecheck
pnpm -C packages/ui build
```

Applications consuming `@wener/ui` must include the package source in their Tailwind scan and own their theme and font configuration. Application-specific routes, authentication, persistence, network calls, and server state stay outside the primitive package.

Server image operations require an explicit entrypoint and are never part of `just ci`:

```bash
just server-list
just server-image wener-apis-server
just server-deploy wener-apis-server
```

The last command requires Docker credentials and a matching `apps/server/builds/<entrypoint>/Dockerfile`; it is intentionally separate from validation and package builds.

## Protobuf workflow

`proto/` is the canonical protobuf source directory. Buf configuration is kept at the repository root in `buf.yaml` and `buf.gen.yaml`. The shared recipes live under [`just/`](just/); package-specific entrypoints can use `just -f just/servers.just ...` when they need to preserve their working directory.

```bash
just buf-fmt
just buf-lint
just buf-gen
```

Generation updates the checked-in clients under `packages/common/src/protos`. CI runs generation and verifies that the generated tree is clean, so generated changes must be committed together with their source or configuration change.

## CI and branches

The GitHub Actions Build workflow runs on `main`, `develop`, and pull requests targeting those branches. It installs the declared pnpm, Node.js, and Just versions, runs `just ci`, installs Chromium, and verifies the complete components and Registry surface. The default public branch is `main`; `develop` is the protected integration branch.

Before opening a pull request, run at least:

```bash
git diff --check
just ci
pnpm -C apps/components verify
```

The root task entrypoint is `just`; there is no second root Makefile to keep in sync. Keep generated Registry and protobuf output deterministic, use Vite+ commands for new formatting and tests, and keep reusable UI contracts separate from application-specific behavior.

## License

Wode is released under the [MIT License](LICENSE).
