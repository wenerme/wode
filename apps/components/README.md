# Wener Components Registry

A shadcn-compatible component registry and Storybook catalog for reusable console patterns.

## Install

Install one item directly:

```bash
npx shadcn add https://ui-components.wener.me/r/console-shell.json
```

Or add the registry namespace to `components.json`:

```json
{
	"registries": {
		"@wener": "https://ui-components.wener.me/r/{name}.json"
	}
}
```

Then inspect or install an item:

```bash
npx shadcn view @wener/console-shell
npx shadcn add @wener/console-shell
```

## Registry Delivery

`registry.json` is a small authored manifest that includes exactly eight domain manifests. The public catalog remains flat: every current item is available at `/r/<name>.json`, regardless of its authored source directory. Never edit `public/r/*.json` or `src/generated/registry-catalog.json`; regenerate both from `registry/` with `pnpm registry:build`.

Canonical source ownership is intentionally hybrid:

- `src/ui/` and `src/components/`: domain-neutral Core primitives and compositions.
- `src/resource/`: query, data view, and record-detail workspaces.
- `src/window/`: reusable window chrome and the WindowManager runtime.
- `src/console/`: shell, navigation, and preferences.
- `src/file/`: path, tree, file-type registry, viewer, manager, and picker.
- `src/agent/`: configuration, chat, work, coding, and playground surfaces.
- `src/auth/`: authentication surfaces.

The eight `src/<domain>/registry.json` files are publishing metadata beside their owned source. Root `registry.json` and generated `public/r/*.json` are the Shadcn delivery adapter; they are not a second implementation tree.

Registry dependencies follow one direction: Resource and Window may use Core; File may use Core and Window; Agent may use Core and File; Console may use Core, Resource, and Window; Auth may use Core. Core does not import a domain. Shared installed targets have one canonical leaf owner; aggregate items consume them through registry dependencies rather than re-declaring files. Every registry dependency must use the exact canonical `https://ui-components.wener.me/r/<name>.json` form; bare names, aliases, relative paths, and third-party URLs are rejected.

Story source mirrors this model under `src/stories/{overview,core,resource,window,console,file,agent,auth,demo}`. Non-Demo Stories follow the same dependency direction; Demo is the only application-composition layer. Stories carry explicit CSF IDs, use only relative canonical Registry source imports, and cannot use `@components/*` or `@ui/*` registry aliases. The structural and Pages checks validate the current emitted IDs and taxonomy without a redirect map.

Run the delivery checks from this package:

```bash
pnpm registry:build
pnpm registry:check
pnpm registry:consumer-check
pnpm storybook:check
pnpm typecheck
pnpm test
pnpm test:storybook
pnpm pages:build
```

`registry:consumer-check` serves current generated JSON from a local loopback server, rewrites only exact canonical Wode self-registry dependencies in its disposable fixtures, and compiles fresh consumers without requesting the public registry. Each invoked `pnpm` command has a 120-second hard timeout through `SIGKILL` plus normal `close` settlement. Use `pnpm registry:consumer-check -- --all` before release for one fresh consumer per public item.

Foundation delivery is intentionally deferred. Consumers own Tailwind, DaisyUI, themes, and fonts explicitly; no registry item installs a hidden global Foundation dependency.

## Console Registry Items

- `console-shell`: global rail, collapsible module navigation, content shell, page layout, and module home.
- `console-data-view`: search, table/grid composition, resource side panels, operations metrics, attention queues, typed inventory tables, selection, and pagination.
- `console-window`: controlled, presentational window chrome, title bar, toolbar, content, status bar, and workspace layout.
- `window-manager`: scoped multi-window runtime with drag/resize, z-order, minimize/maximize/fullscreen, dock, portals, keyboard control, events, and opt-in persistence.
- `file-manager`: filesystem-neutral list/grid explorer with scoped state, an asynchronous virtualized tree, a file-type registry, collapsible resizable panels, CRUD, bounded preview/editing, and Memory/OPFS/local-directory Storybook adapters.
- `console-preferences`: DaisyUI appearance settings with system/light/dark theme mapping, searchable theme catalogs, density/radius/motion controls, Console and component previews, persistence, and About.
- `console-layout`: legacy responsive Menu/Main/Dock layout retained for compatibility.
- `login-page`: customizable Header, Form, SocialLogin, Hero, Footer, and full-region Composite for application-owned authentication flows.

Other components include `addressable-frame`, composable chrome for URL, file, object, and other addressable content without owning navigation or loading runtime; `header-content-footer-layout`, a bounded flex-column layout with composable header, scrollable content, and footer slots; `left-center-right-layout`, a stable three-slot row for toolbars and status bars whose center remains at the geometric center; `resizable`, the shadcn v4 panel group, panel, and accessible separator; `path-address-bar`, a responsive breadcrumb and editable path hybrid with ancestor overflow and contextual current-path actions; `file-tree`, an independently installable lazy and virtualized filesystem tree with bounded loading; `file-viewer`, bounded Text/Image/PDF/Audio/Video/unsupported viewers plus an optional structural filesystem adapter; `status`, a standalone semantic state indicator with plain and compact pill presentations; `loaders`, accessible spinner/dots/bars/ring primitives plus pending buttons, page/section indicators, local overlays, and deterministic list/table skeletons; `query-builder`, a schema-driven nested query AST editor with pure model/reducer/validation, JSON Schema field adaptation, controlled and draft state hooks, searchable fields, and injectable value editors; its default UI copy is Simplified Chinese and remains replaceable through the `messages` prop; `formats`, common value formatters for empty/text/number/currency/percent/bytes/duration/date/boolean/phone values; `hook-form`, React Hook Form basics for provider/form wiring, controlled fields, submit/debug/data-preview controls, dirty values, and field error summaries; `zoom`, an accessible controlled or uncontrolled image zoom with native dialog behavior; `web-vitals`, a headless collector that dynamically loads its measurement runtime only when enabled and mounted; and `update-notification`, a visibility-aware update detector with separate state plus toast, banner, and inline presenters. An additional minimal example is `hello-button`.

## Agent Configuration Editors

Install the shared field/layout primitives or any canonical resource editor independently:

```bash
npx shadcn add @wener/ai-config-editor
npx shadcn add @wener/ai-provider-editor
npx shadcn add @wener/ai-endpoint-editor
npx shadcn add @wener/ai-model-editor
npx shadcn add @wener/ai-service-editor
npx shadcn add @wener/mcp-server-editor
npx shadcn add @wener/agent-persona-editor
npx shadcn add @wener/agent-skill-editor
npx shadcn add @wener/agent-config-studio
```

The resource editors bind directly to canonical exports from `@wener/ai/schema`, `@wener/ai/mcp`, `@wener/ai/agent/persona`, and `@wener/ai/agent/skill`. They are controlled presentation components: consumers own resource discovery, persistence, secret lifecycle, probes, filesystem parsing, and network calls. Form and JSON modes share one local draft; invalid JSON and invalid runtime values are surfaced without emitting changes or mutating the supplied value.

`AiEndpointEditor` binds directly to canonical `EndpointSchema`; Endpoint records remain an independent controlled collection rather than being inferred from `Provider.endpoints` references. The schema has no standalone `metadata` field, so the editor's metadata section exposes only canonical tags, labels, options, and extensions.

`AgentConfigStudio` composes separate controlled arrays and selection callbacks for Provider, Endpoint, Model, Service, MCP, Persona, and Skill resources. Model and Service Endpoint choices come from the canonical Endpoint collection and are limited to unowned Endpoints or Endpoints owned by the selected Provider. It does not create a database, local store, route contract, or nested canonical bundle. Persona assets and Skill resources are manifests only; binary blobs, crawler state, and filesystem traversal remain outside component state.

## Agent Chat Runtime

Install the controlled Chat block independently, or add the browser-direct AI SDK adapter:

```bash
npx shadcn add @wener/agent-chat
npx shadcn add @wener/agent-ai-sdk
```

`AgentChat` composes the transcript scroller, AI SDK `UIMessage` presenter, and multimodal composer without owning transport, storage, routing, workspace, or model discovery. The host controls messages, status, draft text/files, send, stop, and retry. User turns are stable scroll anchors, while live-edge following and jump-to-latest preserve reader intent.

`AiSdkAgentChat` uses AI SDK 7 `ToolLoopAgent`, `DirectChatTransport`, and `useChat` with an OpenAI-compatible browser connection. Applying a new connection aborts the old run and starts an isolated in-memory Chat revision; messages cross revisions only when the host explicitly supplies controlled messages. Browser-safe injected tools execute through native AI SDK tool parts, and custom tool renderers can answer native approval requests through `addToolApprovalResponse`.

`AgentChatPlayground` keeps connection draft, applied connection, API key, model list, transcript, and composer draft in React memory only. It never appends `/v1`: enter the complete API base path required by the service. Model discovery requests `<baseUrl>/models`; direct Chat requests are produced by `@ai-sdk/openai-compatible`. Public examples use `https://example.com/v1` and `example-model`; provide real values only at runtime.

The direct adapter is intentionally not a server proxy. Browser deployment must account for provider CORS and the exposure risk of browser-held credentials. No value is persisted, logged, placed in URLs, or included in Story args by these blocks.

## Agent Work And Coding

Install the workspace surfaces independently or use the complete memory-only Playground:

```bash
npx shadcn add @wener/agent-work
npx shadcn add @wener/agent-coding
npx shadcn add @wener/agent-playground
```

`AgentWork` composes a caller-owned Chat node with an `IFileSystem` workspace. Desktop containers get resizable Chat and Workspace panes; narrow containers get a segmented single-pane view. The FileManager store remains scoped and stable, while `AgentWorkspace.revision` requests a refresh without remounting it. Workspace context is loaded from one explicit AGENTS path and explicit `Skill[]`; the block never discovers Skills from the filesystem. AGENTS, Skill fields, aggregate instructions, list results, file reads, and paths all have fail-closed limits.

`AgentCoding` adds a controlled plain-text terminal and approval-required `workspace_write`/`bash` tools. Bash only calls an injected `AgentCommandExecutor`; there is no PTY, ANSI renderer, stream claim, or host-shell fallback. An active runtime transition quarantines workspace mutations before cancellation and releases them only after a safe settle; an unsettled result keeps terminal, tools, FileManager, and previously acquired writable streams quarantined. Terminal history retains the newest 64 bounded results.

`AgentPlayground` owns only transient React state for mode, connection, selected Persona/Skills, workspace context/revision, approvals, and terminal history. Chat receives Persona instructions only and disables workspace context loading, so it performs no AGENTS read; Work reloads AGENTS/Skills and adds read-only tools; Coding adds write/bash. Runtime identity changes cancel an old active command before resetting the controlled runtime state. A supplied just-bash module loader is initialized lazily in Coding mode, and registry source never imports `just-bash/browser`. An injected executor is a host trust boundary: it must not mutate the workspace outside the supplied IFileSystem contract. In particular, a rooted Node adapter rejects lexical escape and observed symlinks but is not a sandbox against another same-host process racing pathname replacement. The Live Story exposes a public Story-only esm.sh loader and starts with blank Base URL, API Key, and model fields.

The Console blocks use Tailwind CSS 4 and DaisyUI semantic classes. The registry installs `daisyui`, but the consuming app must also enable the plugin and the themes it wants to expose. The default preferences catalog contains all DaisyUI 5 themes plus `wener`; use `themes: all` for parity with Storybook, or pass a smaller `themeOptions` list that matches the compiled themes:

```css
@import 'tailwindcss';
@plugin "daisyui" {
	themes: all;
}
```

Theme state stores `themeMode` (`system`, `light`, or `dark`) separately from `lightTheme` and `darkTheme`, so following the operating system can still use a chosen theme for each color scheme. Motion uses `system`, `reduced`, or `full`; legacy `reducedMotion` booleans migrate without changing their meaning. A custom `themeOptions` catalog must use unique values and contain at least one light and one dark theme; its first theme in each scheme becomes the reset fallback. Legacy custom theme names remain applicable during storage migration.

`ConsoleDisplaySettingsPanel` is the ready-to-use composite. `ConsoleDisplaySettingsLayout`, `ConsoleDisplaySettingsHeader`, `ConsoleThemeCatalog`, `ConsoleThemeDemo`, and `ConsoleThemeComponentPreview` can be composed independently when an application owns the surrounding settings page.

## File Manager

Install the generic block with `npx shadcn add @wener/file-manager`. Its `FileManagerFileSystem` type is a structural subset of `@wener/common/fs` `IFileSystem`, so Memory, OPFS, local directory, WebDAV, or application-owned adapters can be supplied without backend-specific UI branches.

Use `showFileManager({ windowManager, fileManager, window })` to open the same manager inside a scoped WindowManager. The helper defaults to a reusable non-persistent window and does not depend on a global runtime; `renderFileManagerWindow(win)` plugs into the host content renderer.

The sidebar combines Places and the independent `file-tree` registry item. `FileTree` accepts a structural async `readdir` adapter, lazy-loads expanded paths, virtualizes visible rows with `react-arborist`, and enforces configurable depth, node, cache, and concurrent-read limits. FileManager activation navigates the main workspace and uses the same file-type icon registry; picker variants restrict the tree to directories.

Writable managers support native drag and drop across the current listing surface, directory rows/cards, and FileTree directory nodes. Internal entries move by default and copy while `Alt`/`Option` or `Ctrl` is held. External drops upload multiple local files; local directory recursion is intentionally rejected. Uploads default to 256 files, 100 MiB per file, and 512 MiB total, configurable through `maxUploadFiles`, `maxUploadBytes`, and `maxUploadTotalBytes`. Operations retain per-item completed/failed results, expose cancellation, map common filesystem errors to user-facing feedback, and can retry failed or unattempted items without replaying completed work. Read-only or upload-disabled managers prevent browser file navigation and show an explicit rejection.

Directory listings default to 2,000 entries and can be raised through `maxListingEntries` up to the 10,000-entry hard limit. Downloads default to 256 MiB per file and 512 MiB per batch through `maxDownloadBytes` and `maxDownloadTotalBytes`; adapters receive a bounded `maxBytes` request and the returned byte length is checked again before delivery.

`getFileManager()` returns the app-global file-type manager. Register definitions for matching, MIME inference, icons, list/grid display, details, viewers, and editors; the returned function removes that exact stack entry. Use `createFileManager({ parent: getFileManager(), definitions })` with `FileManagerRegistryProvider` for tenant, module, Story, or test isolation. Higher priority wins first, then match specificity, child scope, and registration order; a child definition with the same `id` fully shadows its parent until unregistered.

```tsx
const unregister = getFileManager().fileTypes.register({
	id: 'workflow',
	label: '工作流',
	priority: 500,
	match: { extensions: ['flow'] },
	icon: WorkflowIcon,
	viewer: { component: WorkflowViewer },
});
```

Install `file-picker` for standard filesystem selection workflows. `FilePicker`/`showFilePicker({ multiple })` open one or more files, `DirectoryPicker`/`showDirectoryPicker()` choose a directory, and `SaveFilePicker`/`showSaveFilePicker()` return a validated save target with overwrite confirmation without writing the file. Programmatic picker cancellation resolves `undefined`; every WindowManager call owns an independent non-persistent window and promise.

The component owns navigation, selection, bounded preview, operation state, and presentation. Consumers continue to own authentication, authorization, audit logging, domain metadata, handle persistence, remote object delivery, and download policy. Preview reads use `ReadFileOptions.maxBytes`; custom adapters should apply that limit before allocating the returned value.

The default toolbar composes `path-address-bar`, while the preview composes `file-viewer`. Install either primitive independently when an application needs the interaction outside FileManager:

```bash
npx shadcn add @wener/path-address-bar
npx shadcn add @wener/file-viewer
```

`PathAddressBar` keeps committed path, edit draft, validation, and navigation callbacks controlled by the consumer. It supports root-relative breadcrumbs, responsive ancestor folding, `Ctrl`/`Cmd`+`L`, Enter/Escape editing, and a generic current-path menu slot.

`FileViewer` is the presentation dispatcher. `FileSystemFileViewer` is an optional adapter that performs bounded binary reads, aborts stale requests, owns object URLs, and can save standalone text files. FileManager does not use direct adapter saves: its text changes continue through the FileManager runtime so backend replacement and terminal operation events remain authoritative.

## Window Manager

`window-manager` keeps serializable state in a context-scoped Zustand/Mutative store. React content stays in a host renderer, so layout snapshots never contain React nodes, mutable window objects, DOM references, or global singleton state.

```tsx
const store = createWindowManagerStore({
	initialWindows: [{ key: 'services', kind: 'services', title: 'Services' }],
});

<WindowManagerProvider store={store}>
	<WindowManagerPersistence storage='local' storageKey='console.layout.v1' />
	<WindowManagerHost renderContent={(win) => renderers[win.kind]?.(win)} />
</WindowManagerProvider>;
```

Use `WindowManagerPortalHost` instead of `WindowManagerHost` when the workspace must mount into `document.body` or another portal container. Persistence is disabled unless `WindowManagerPersistence` is mounted; window `data` is excluded unless `serializeData` explicitly returns a safe projection. The default host supports `Ctrl+F6` window cycling, `Alt+F9` minimize, `Alt+F10` maximize, `Escape` to leave workspace fullscreen, and `Ctrl+Alt+Arrow` movement (`Shift` resizes).

## Development

```bash
pnpm -C apps/components registry:build
pnpm -C apps/components storybook
pnpm -C apps/components test:storybook
pnpm -C apps/components dev
```

Storybook imports the registry source directly. It does not maintain a second copy of the components.

Storybook 10.5 runs all stories in two Vitest browser projects: the `wener` theme with a mobile viewport and the `night` theme with a desktop viewport. The Storybook dev server also exposes the local MCP endpoint at `http://localhost:6053/mcp`; register this URL in a compatible client's local MCP configuration.

Agentic review, change detection, component manifests, and the experimental React docgen server are enabled for local Storybook development. Static builds publish the component manifest at `/manifests/components.json` and referenced metadata under `/services/core/`.

The optional Claude and Codex ADE plugins are user-level experimental integrations and are not installed by the repository:

```bash
claude plugin marketplace add storybookjs/mcp@e4f90aa7d8ac8c73e54a3780109af5937b53c824 --scope user
claude plugin install storybook@storybook --scope user

codex plugin marketplace add storybookjs/mcp --ref e4f90aa7d8ac8c73e54a3780109af5937b53c824
codex plugin add storybook@storybook
```

## Verification

```bash
pnpm -C apps/components verify
```

This runs strict TypeScript and the complete component test suite, checks that tracked `/public/r` output is current, builds Waku, then rebuilds and validates the static Storybook Pages artifact.

## Static Publishing

The GitHub Pages artifact is the Storybook static build. Storybook copies `public/`, so the same deployment serves:

- `/`: human-facing Storybook catalog.
- `/r/registry.json`: shadcn registry catalog.
- `/r/<name>.json`: installable registry items.

The Waku/Cloudflare build remains the custom registry landing at `ui-components.wener.me`.
