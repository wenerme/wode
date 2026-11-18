# Registering services and maintaining CLI documentation

Service definitions, CLI bindings and the application catalog have separate responsibilities. SQL, Redis and Prometheus use these registration APIs. Existing provider adapters continue to work while they are migrated.

## Register typed operations

Declare the service interface and a capability token next to it. The token is a plain string at runtime and carries the interface at the type level, so there is no central capability table to edit:

```ts
// sql/ISqlService.ts
import { defineServiceCapability } from '@wener/common/service/registry';

export interface ISqlService extends AsyncDisposable { /* ... */ }
export const SqlServiceCapability = defineServiceCapability<ISqlService>('sql');
```

Define each exposed operation with `defineServiceOperation` from `@wener/common/service/runtime`. The token types the `invoke` service argument:

```ts
import { defineServiceOperation } from '@wener/common/service/runtime';
import { z } from 'zod';
import { SqlServiceCapability } from './ISqlService';

const ping = defineServiceOperation({
  capability: SqlServiceCapability,
  input: z.strictObject({}),
  tool: {
    description: 'Check SQL connectivity',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true },
  },
  invoke: (sql, _input, options) => sql.ping(options),
});
```

Type the provider with the service interface itself, `ServiceProviderDefinition<ISqlService>`, and list the token in `provides`. A provider exposing several capabilities uses a union, e.g. `ServiceProviderDefinition<ISearchService | IFetchService>`. `registry.load(SqlServiceCapability, name)` resolves to `ISqlService`; a bare string key loads the same service typed as `unknown`.

The helper checks capability, parsed input and return types. Add the operation map to the provider's `operations` field. Explicit operations form the provider's complete transport tool set; the runtime does not fall back to legacy dispatch for missing names. An empty map exposes no tools. Unknown input, cancellation and read-only policy are checked before loading a service.

Keep options schema, aliases, descriptions, examples and contracts on the provider definition. Factory functions create services only when invoked. Native dependencies enter through host driver factories.

See [SQL operations](../../packages/wener-common/src/service/sql/operations.ts), [Redis operations](../../packages/wener-common/src/service/redis/operations.ts) and [Prometheus operations](../../packages/wener-common/src/service/prometheus/operations.ts).

## Bind a CLI definition

Use `ServiceCliDefinition<S>` for argument preparation and output projection, then pair it with provider identity through `defineServiceCliBinding`. For example:

```ts
import { defineServiceCliBinding } from '@wener/common/service/cli';
import { SqlServiceProvider } from '@wener/common/service/sql';
import { SQLCliDefinition } from '@wener/common/service/sql/cli';
import { createSqlServiceToolClient } from '@wener/common/service/sql/client';

const binding = defineServiceCliBinding({
  provider: SqlServiceProvider,
  definition: SQLCliDefinition,
  createClient: (runtime, service, options) =>
    createSqlServiceToolClient(runtime, service, options),
});
```

The factory receives `{ readOnly, signal }`. Omit it to use the application's generic remote tool client. Defining, describing and registering a binding does not create a client. The binding snapshots its execution definition and serializable metadata together, including aliases, options, examples and mutation flags.

For a new provider, adapt it with `createServiceProviderAdapter`, add it to `WocliHost.providers`, and pass its binding through `WocliHost.serviceCliBindings`. Built-in bindings live in the `apps/woctl/src/builtin` application assembler; provider-only consumers import individual providers from `@wener/common/service/provider/*`. Avoid importing CLI definitions through a provider entry point. The application assembler does not need a separate command block for each injected binding. Do not inject another copy of an existing built-in command.

`prepare` validates CLI input before creating clients. Mutation commands must require both `readOnly: false` and `--yes` before reading files or stdin. Command names, descriptions and errors use English.

## Reusable redaction

Service and protocol clients preserve the data promised by their contracts. A property name such as `password`, `token` or `headers`, or a value matching a request credential, does not authorize silently replacing or removing business data. Requested normalization, pagination and codecs remain part of the contract; sensitivity-based projection belongs to a separate boundary.

| Boundary | Responsibility |
| --- | --- |
| Service, SDK and internal calls | Keep functional data intact for downstream calls, export and read/write round trips. |
| Server response and client transport | Enforce authorization and the declared response contract. Apply any disclosure policy explicitly to a response copy. A client header or flag expresses a preference and does not grant permission. |
| CLI and UI display | Select a presentation policy independently of the service result. Shared service commands and generic `service call` use `--redact` for an explicit display projection. |
| Logs, diagnostics and configuration inspection | Produce a view appropriate to that diagnostic surface, preserving the structured information callers need to handle an error. |

Keep original data separate from display copies and never store a redacted view in a service cache or feed it back into a mutation. Domain-specific display contracts can define their own visibility controls, such as TSIG `--show-secret`. These controls do not change the native service/client result or authorize disclosure on a remote server.

When a server withholds data, use a declared response representation, contract-defined field omission or an access error. A masked value must not silently stand in for a usable credential or configuration value in the original functional DTO. The client needs to know which representation it requested and received.

`@wener/common/redact` provides the optional projection utility. Shared CLI adaptation applies it after the prepared service invocation succeeds and only when `--redact` is set; domain operation callbacks return original results by default. Generic `service call` follows the same rule for every provider. Direct SDK calls, remote typed clients and MCP result envelopes keep their ordinary contracts. Server applications can select a response policy using their trusted request context; importing this utility installs no server policy.

```ts
import {
  createRedactor, getRedactor, isSensitive, redact, setRedactor,
} from '@wener/common/redact';

const value = { password: 'example-value', label: 'example' };
isSensitive(value); // true
redact(value); // { password: '<redacted>', label: 'example' }

const policy = createRedactor({
  marker: '***',
  sensitiveKeys: ['internalValue'],
  knownSecrets: ['example-custom-secret'],
});
policy.redact(value); // The source value remains unchanged.

const previous = setRedactor(policy);
try {
  getRedactor() === policy; // true
  redact(value); // Uses the current shared policy.
} finally {
  setRedactor(previous);
}
```

`createRedactor` snapshots custom keys, secrets and regex patterns; independent service or request policies should use separate instances. `setRedactor()` without an argument resets the shared default and returns its previous instance. `redact` and `isSensitive` delegate to the current shared instance on each call. Stateless helpers include `redactValue`, `redactText`, `redactMessage`, `isSensitiveKey` and `redactCredentialShapes`; diagnostic helpers can therefore retain a policy independent of global display customization.

The default policy recognizes sensitive key names, config-item records, common token formats, URL credentials and secret query parameters, DSNs, PEM private keys, JSON, YAML and property assignments. It supports non-mutating copies of objects, arrays, Map/Set, Error/cause and common web types, including cyclic/shared references. Accessors are not executed, and custom `toJSON` hooks are disabled on copied objects. Date, RegExp, binary data, functions, streams and arbitrary class instances remain opaque. The generic return type is a convenience for display use; masked fields can contain marker strings rather than their original field type.

Null, undefined, empty strings and whitespace-only strings remain unchanged and are not sensitive, even under a sensitive key or custom rule. This also applies to empty config-item fields, JSON/YAML fields and URL parameter values. Zero and false remain meaningful values. Content detection examines non-empty values independently of field names, including known secrets and custom patterns. URL strings decode query values for detection and retain empty or valueless parameters. YAML retains a syntax-specific adapter because comments, block scalars and aliases require handling beyond a JSON data tree; scalar redaction rules are shared.

Default bounds are 64 levels, 10,000 visited nodes and 1,000,000 UTF-16 units per string. Exceeding a bound masks the affected data conservatively. Free-text diagnostics use `redactMessage`, which preserves individual lines and does not interpret an error message as YAML.

## Export registered metadata

The application API exposes `cli.catalog()` for the complete registered command graph. It includes global flags, aliases, examples, provider options, static tools, contracts and availability requirements. `cli.describe()` retains its selected-context behavior.

```sh
woctl catalog --output json
woctl catalog --output md --output-file commands.md
woctl catalog --service-type pg --output typescript --output-file sql.d.ts
woctl catalog --output jsonschema --output-file catalog.schema.json
```

Catalog generation does not load configuration, resolve credentials or environment context, invoke provider factories, or access remote services. A provider filter accepts canonical names and aliases; capability commands appear for providers that supply the required capability. Host capabilities, such as MCP connectivity, are described separately.

The `jsonschema` format describes the versioned catalog document. It is not the native YAML configuration schema. TypeScript includes registered options and contracts or static tools. Providers with only runtime discovery contribute no invented method declarations.

## Link a private Node host

`woctl/node` is a workspace TypeScript source entry for applications using tsx, Bun or a bundler. It follows the existing workspace web/shell entry pattern; the npm package remains a CLI distribution. Link the source application from the private consumer, using the repository path on your machine:

```sh
pnpm link "$WODE_REPO/apps/woctl"
```

The consumer needs Node.js 24.11 or later. Its existing tsx development command or esbuild build can resolve the linked source and its workspace dependencies:

```ts
import { createNativeHost, createWocliCli, type WocliCommand } from 'woctl/node';

export function createPrivateCli(configPath: string) {
  const native = createNativeHost({ config: configPath });
  const internal: WocliCommand = {
    name: 'internal',
    description: 'Private application commands',
    commands: [{
      name: 'status',
      description: 'Show private application status',
      run: (_input, context) => context.stdout('ready'),
    }],
  };
  return createWocliCli({
    ...native,
    commands: [...(native.commands ?? []), internal],
  });
}
```

Call `cli.execute(argv, io)` from the consuming application's bootstrap. The caller owns process arguments, signal handling and output streams. Importing the Node entry installs no process handlers and does not load a configuration store. Constructing a native host does not execute a command.

Append private service adapters through `providers` and their command bindings through `serviceCliBindings`. Preserve the native `commands` array when adding commands so PDF/XLSX remain available. For an existing private configuration format, supply a `WocliHost.config` adapter that returns the canonical configuration model. The consumer retains its private selection, credentials and deployment policy; shared Linear command and protocol behavior stays in this repository.

The external-consumer regression actually runs local `pnpm link`, typechecks SDK use, bundles through esbuild, and executes public and private commands with Node. This validates workspace linking; it does not test an npm-distributed SDK.

Both ESM and CommonJS builds are covered, including the CommonJS format currently used by wcli. Document resources resolve relative to the module or final bundle. When externalizing PDF/XLSX engines, retain their runtime packages in the consuming application, as wcli already does.

## Regenerate the command reference

From the repository root:

```sh
node --import tsx apps/woctl/scripts/generate-reference.ts --write
node --import tsx apps/woctl/scripts/generate-reference.ts --check
```

The script constructs the native command graph and writes [reference.md](reference.md). It does not load its configuration store. Run `--write` after changing registered metadata and include the resulting reference diff. Use `--check` in validation to detect drift. The same commands are available as `docs:generate` and `docs:check` in `apps/woctl/package.json`.

The reference documents current source metadata. Service guides explain workflows and validation limits; keep those examples in sync when behavior changes. Static documentation does not establish connectivity to any real backend.
