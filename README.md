# Wode

Wode is Wener's TypeScript monorepo for React console surfaces, reusable UI primitives, service and API tooling, AI/MCP integrations, and protobuf contracts.

The name comes from **Wener nODE & DEMO**. The repository is organized as a pnpm workspace and uses Just for reusable task recipes, Bun for type checking and formatting, Biome for lint rules, and Vite and Vitest for builds and tests.

## Repository layout

| Path                                                                 | Responsibility                                                                                     |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
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
- pnpm `12.4.2`
- Bun `1.4.4` (pinned in `.bun-version` for CI)
- Just `1.38.0` or newer
- Buf CLI for protobuf formatting, linting, and generation
- Chromium for the package Storybook interaction tests

The required package-manager and runtime versions are declared in the root `package.json`. Install pnpm with Corepack or through your preferred system package manager, then install dependencies:

```bash
corepack enable
pnpm install
```

For the package Storybook interaction tests, install Chromium once on the development machine:

```bash
pnpm -C packages/ui exec playwright install --with-deps chromium
```

## Common commands

Run commands from the repository root unless a command includes `-C`.

| Command                           | Purpose                                                                                                 |
| --------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `just dev`                        | Start workspace development tasks in parallel through Turbo.                                            |
| `just build`                      | Build workspace packages and applications through Turbo.                                                |
| `just test`                       | Run workspace tests through Turbo.                                                                      |
| `just fmt [paths...]`             | Format files with Bun; without paths, format the repository using its ignore rules.                     |
| `just fmt-check [paths...]`       | Check formatting; without paths, check changed files against `WODE_FORMAT_BASE` or `origin/develop`.    |
| `just lint`                       | Run Biome lint rules.                                                                                   |
| `just typecheck`                  | Run `bun check --no-script -b` across every referenced workspace project.                               |
| `just check`                      | Run changed-file formatting, lint rules, and workspace type checking.                                   |
| `just buf-fmt` / `just buf-lint`  | Format or lint the canonical protobuf tree.                                                             |
| `just buf-gen`                    | Generate protobuf clients and normalize generated output.                                               |
| `just ci`                         | Run the CI baseline: frozen install, protobuf checks, `just check`, and selected tests.                 |
| `just test-ci --base origin/main` | Run the offline CI tests related to changes since a Git base; use `just test-ci` for the full baseline. |

Vite and Vitest own the repository's test workflow. New test files should import test APIs from `vitest` and run through `pnpm exec vitest run` or the package script that wraps it.

### Bun toolchain

`bun check --no-script -b` checks every project referenced by the root solution `tsconfig.json`, using each package's own compiler options. It reads referenced source directly and writes no JavaScript, declarations, or `.tsbuildinfo`. `just typecheck` also checks that newly added workspace packages have not been omitted from the solution. Keep each package's existing `tsc` command for editor/declaration compatibility; `pnpm run typecheck:tsc` runs the previous workspace checks for comparison.

Use `bun check --no-script -p packages/wener-utils` for one package, or `bun check --no-script path/to/file.ts` for a file and its imports. The explicit `--no-script` avoids a package's `check` script taking precedence over Bun's built-in command. Bun's embedded TypeScript version is available with `bun -p process.versions.typescript`.

The formatting recipes pass the shared `.prettierrc.json` explicitly to `bun fmt --no-script`, including from package directories. Duplicate per-package Prettier plugin configurations have been removed. The settings retain tabs, 120-column lines, and single quotes; `.prettierignore` excludes generated protobuf/parser files, lockfiles, dependencies, and build output. Biome's formatter is disabled so local formatting and CI use the same engine; run `just fmt` before committing and `just check` before opening a pull request.

Formatting is adopted gradually: `just fmt-check` uses Bun's `--changed` selection, which includes committed changes since the base and local staged, unstaged, and untracked files. PRs use the target SHA, pushes use the previous SHA, and manual GitHub runs use `HEAD^`. A new branch's zero previous SHA falls back to `origin/develop`. To check the entire repository explicitly, run `just fmt-check .`; existing files may need formatting before a full check passes. To format only a PR's files, run `just fmt --changed=origin/develop`.

The root [`justfile`](justfile) imports reusable workspace recipes from `just/*.just`. Every package and application has a local `justfile` that imports [`just/pkg.just`](just/pkg.just), so commands can be run from the package directory without `-f` paths:

```bash
cd packages/wener-common
just fmt
just fmt-check src/example.ts
just typecheck
just build

# The generic package recipes are also available through the root dispatcher.
just pkg fmt
```

Package-specific build and publish behavior belongs in `packages/*/justfile` and `apps/*/justfile`; workspace-wide orchestration belongs in `just/workspace.just`, `just/ci.just`, and the domain files for Proto and server entrypoints.

## UI package

`packages/ui` owns the reusable, application-agnostic UI surface. It exposes independent subpaths such as `@wener/ui/button`, `@wener/ui/dialog`, `@wener/ui/input`, and the generic composed families under `@wener/ui/components/*`. It uses Base UI for stateful behavior and Tailwind CSS/DaisyUI-compatible classes for presentation. Its verification commands are:

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

`proto/` is the canonical protobuf source directory. Buf configuration is kept at the repository root in `buf.yaml` and `buf.gen.yaml`. The server entrypoint recipes live in [`apps/server/justfile`](apps/server/justfile), while root wrappers such as `just server-list` preserve the package working directory.

```bash
just buf-fmt
just buf-lint
just buf-gen
```

Generation updates the checked-in clients under `packages/common/src/protos`. CI runs generation and verifies that the generated tree is clean, so generated changes must be committed together with their source or configuration change.

## CI and branches

The GitHub Actions Build workflow runs on `main`, `develop`, and pull requests targeting those branches. It installs the declared pnpm, Node.js, Bun, and Just versions, runs `just ci`, runs the package UI tests, and builds the package Storybook. Gitea also installs the pinned Bun and runs `just check` before package builds. The default public branch is `main`; `develop` is the protected integration branch.

Pull requests provide their target commit as `WODE_TEST_BASE`. The CI test wrapper uses Vitest related testing for ordinary source and Storybook changes, skips documentation-only changes, and falls back to full coverage for dependency, configuration, generated, deleted, or ambiguous inputs. Pushes and manual runs keep the full test baseline. `WODE_FORMAT_BASE` independently selects the formatting comparison base.

Before opening a pull request, run at least:

```bash
git diff --check
just ci
pnpm -C packages/ui test
pnpm -C packages/ui build-storybook:static
```

The root task entrypoint is `just`; there is no second root Makefile to keep in sync. Keep protobuf output deterministic, use Bun for formatting and type checks and Vitest for tests, and keep reusable UI contracts separate from application-specific behavior.

## License

Wode is released under the [MIT License](LICENSE).
