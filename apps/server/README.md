# Server applications

`apps/server` contains the server entrypoints that share the Wode application and package layers. Each entrypoint is discovered from `src/apps/<name>/main.ts` and is bundled through the shared recipes in [`../../just/servers.just`](../../just/servers.just).

Current entrypoints:

- `wener-apis-server`
- `wode-api-server`
- `wode-service-agent`

List the available entrypoints from the repository root:

```bash
just server-list
```

Run or build one entrypoint:

```bash
just server-dev wode-api-server
just server-build wode-api-server
just server-run wode-api-server
```

The package build script builds all discovered entrypoints:

```bash
pnpm build
```

For direct package-local use, run the shared recipe file explicitly:

```bash
cd apps/server
just -f ../../just/servers.just list
just -f ../../just/servers.just dev wode-api-server
just -f ../../just/servers.just build-all
```

Configuration is loaded by the selected application at runtime. Keep credentials in ignored `.env` files and do not commit environment-specific values.
