import type { ContractRouterClient } from '@orpc/contract';
import Ajv2020 from 'ajv/dist/2020.js';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { toJsonSchema } from '../../schema';
import {
	ApolloServiceContract, ApolloToolInputs, ApolloWriteOperations,
	type IApolloServiceContract, type ApolloServiceClientContext, type ApolloServiceInputs, type ApolloServiceOutputs,
} from './ApolloServiceContract';
import type { IApolloService } from './core/interface';
import { redactApolloValue } from './core/redactor';
import { ApolloOperations } from './operations';

const writes = ['request', 'createApp', 'createAppEnv', 'updateApp', 'deleteApp', 'createCluster', 'deleteCluster',
	'createNamespace', 'deleteNamespace', 'createMissingNamespace', 'upsertItem', 'deleteItem', 'publishRelease',
	'rollbackRelease', 'patchNamespaceItem', 'writeNamespaceText', 'patchNamespaceDocument', 'publishNamespaceRelease'];
const optional = ['readConfig', 'getStatus', 'listPortalApp', 'listPortalOrganization', 'listPortalEnv', 'getPortalNavTree',
	'listPortalNamespace', 'getPortalNamespace', 'listPortalItem', 'listPortalRelease', 'getPortalConfig', 'listRelease',
	'listApp', 'getApp', 'listSelfApp', 'listMissingAppEnv', 'getEnvCluster', 'getCluster', 'listNamespace', 'getNamespace',
	'getNamespaceLock', 'deleteNamespace', 'listNamespaceUsage', 'listMissingNamespace', 'createMissingNamespace',
	'listItem', 'getLatestRelease', 'publishRelease', 'diffNamespaceRelease', 'publishNamespaceRelease'] as const;

describe('Apollo service contract', () => {
	it('derives the full client and instance business methods through native oRPC types', () => {
		expectTypeOf<IApolloServiceContract>().toEqualTypeOf<ContractRouterClient<typeof ApolloServiceContract, ApolloServiceClientContext>>();
		expectTypeOf<keyof IApolloServiceContract>().toEqualTypeOf<keyof typeof ApolloServiceContract>();
		expectTypeOf<keyof IApolloService>().toEqualTypeOf<keyof IApolloServiceContract | 'type' | 'readOnly' | 'close'>();
		expectTypeOf<Parameters<IApolloService['publishNamespaceRelease']>[0]>().toEqualTypeOf<ApolloServiceInputs['publishNamespaceRelease']>();
		expectTypeOf<Awaited<ReturnType<IApolloService['diffNamespaceRelease']>>>().toEqualTypeOf<ApolloServiceOutputs['diffNamespaceRelease']>();
		expectTypeOf<ApolloServiceOutputs['diffNamespaceRelease']['count']>().toEqualTypeOf<number>();
		expectTypeOf<ApolloServiceOutputs['publishNamespaceRelease']['published']>().toEqualTypeOf<boolean>();
		expectTypeOf<ApolloServiceOutputs['patchNamespaceItem']['changes'][number]['op']>().toEqualTypeOf<'create' | 'update' | 'delete'>();
	});

	it('preserves legacy request<T> casts with native parameters and unknown defaults', () => {
		type MyDto = { id: string };
		type NativeRequestArgs = Parameters<IApolloServiceContract['request']>;
		expectTypeOf<Parameters<IApolloService['request']>>().toEqualTypeOf<NativeRequestArgs>();
		expectTypeOf<ApolloServiceOutputs['request']>().toEqualTypeOf<unknown>();
		expectTypeOf<Omit<IApolloService, 'request' | 'type' | 'readOnly' | 'close'>>()
			.toEqualTypeOf<Omit<IApolloServiceContract, 'request'>>();

		// Compile only: the generic preserves the caller's assertion, not runtime validation.
		const check = (service: IApolloService, native: IApolloServiceContract, ...args: NativeRequestArgs) => {
			expectTypeOf<Parameters<typeof service.request<MyDto>>>().toEqualTypeOf<NativeRequestArgs>();
			expectTypeOf(service.request<MyDto>({ path: '/apps' })).toEqualTypeOf<Promise<MyDto>>();
			expectTypeOf(service.request<MyDto>(...args)).toEqualTypeOf<Promise<MyDto>>();
			const defaultResult = service.request(...args);
			const nativeResult = native.request(...args);
			expectTypeOf<Awaited<typeof defaultResult>>().toEqualTypeOf<unknown>();
			expectTypeOf<Awaited<typeof nativeResult>>().toEqualTypeOf<unknown>();
			expectTypeOf(defaultResult).toExtend<Promise<unknown>>();
			expectTypeOf(nativeResult).toExtend<Promise<unknown>>();
			expectTypeOf(service.request<MyDto>({ path: '/apps' }, { signal: new AbortController().signal }))
				.toEqualTypeOf<Promise<MyDto>>();
			// @ts-expect-error The native contract does not promise a caller-selected DTO.
			native.request<MyDto>({ path: '/apps' });
			// @ts-expect-error Native request input still requires path.
			service.request<MyDto>({});
			// @ts-expect-error Native request options require an AbortSignal.
			service.request<MyDto>({ path: '/apps' }, { signal: 'invalid' });
			// @ts-expect-error Cancellation belongs in native options, not input.
			service.request<MyDto>({ path: '/apps', signal: new AbortController().signal });
		};
		void check;
	});

	it('projects schemas without a second list', () => {
		expect(Object.keys(ApolloServiceContract)).toHaveLength(47);
		expect(Object.keys(ApolloOperations)).toEqual(Object.keys(ApolloServiceContract));
		expect(Object.keys(ApolloToolInputs)).toEqual(Object.keys(ApolloServiceContract));
		for (const name of Object.keys(ApolloServiceContract) as Array<keyof typeof ApolloServiceContract>) {
			expect(ApolloToolInputs[name]).toBe(ApolloServiceContract[name]['~orpc'].inputSchema);
		}
	});

	it('defaults exactly the inputs that existing callers may omit', () => {
		for (const [name, procedure] of Object.entries(ApolloServiceContract)) {
			const parsed = procedure['~orpc'].inputSchema!.safeParse(undefined);
			expect(parsed.success, name).toBe(optional.includes(name as typeof optional[number]));
			if (parsed.success) expect(parsed.data).toEqual(procedure['~orpc'].inputSchema!.parse({}));
		}
		expect(ApolloToolInputs.listRelease.parse(undefined)).toEqual({ page: 0, size: 20, active: false });
		expect(ApolloToolInputs.listPortalRelease.parse(undefined)).toEqual({ page: 0, size: 5 });
		expect(ApolloToolInputs.publishNamespaceRelease.parse(undefined)).toEqual({ dryRun: false });
	});

	it('exports AJV-valid schemas and preserves pre-default input constraints', () => {
		const ajv = new Ajv2020({ strict: false });
		for (const [name, operation] of Object.entries(ApolloOperations)) {
			expect(() => ajv.compile(operation.tool.inputSchema), name).not.toThrow();
			expect(() => ajv.compile(operation.tool.outputSchema!), name).not.toThrow();
		}
		for (const name of optional) expect(ajv.compile(ApolloOperations[name].tool.inputSchema)({}), name).toBe(true);
		const validate = ajv.compile(ApolloOperations.listRelease.tool.inputSchema);
		expect(validate({ page: 1 })).toBe(true);
		expect(validate({ page: -1 })).toBe(false);
		expect(validate({ page: null })).toBe(false);
		expect(ajv.compile(ApolloOperations.request.tool.inputSchema)({ path: '/apps' })).toBe(true);
		expect(ajv.compile(ApolloOperations.createApp.tool.inputSchema)({})).toBe(false);
	});

	it.each(['patchNamespaceItem', 'patchNamespaceDocument'] as const)('retains the non-empty edit rule for %s in Zod and AJV', (name) => {
		const validate = new Ajv2020({ strict: false }).compile(ApolloOperations[name].tool.inputSchema);
		const edit = name === 'patchNamespaceItem' ? { set: [{ key: 'a', value: 'b' }] } : { merge: [{ a: true }] };
		for (const value of [{}, { set: [], delete: [] }]) {
			expect(validate(value)).toBe(false);
			expect(ApolloToolInputs[name].safeParse(value).success).toBe(false);
		}
		expect(validate(edit)).toBe(true);
		expect(ApolloToolInputs[name].safeParse(edit).success).toBe(true);
	});

	it('retains all 18 write annotations and limits dry-run metadata to actual previews', () => {
		expect([...ApolloWriteOperations]).toEqual(writes);
		for (const [name, operation] of Object.entries(ApolloOperations)) {
			expect(operation.tool.annotations?.readOnlyHint).toBe(!writes.includes(name));
			expect(operation.tool.annotations?.destructiveHint).toBe(writes.includes(name));
		}
		expect(Object.keys(ApolloServiceContract).filter((name) => ApolloOperations[name as keyof typeof ApolloOperations].tool.annotations?.supportsDryRun))
			.toEqual(['patchNamespaceItem', 'writeNamespaceText', 'patchNamespaceDocument', 'publishNamespaceRelease']);
	});

	it('accepts text, raw/config JSON and structured data after redaction without erasing the output domain', () => {
		const output = ApolloServiceContract.readConfig['~orpc'].outputSchema!;
		const validate = new Ajv2020({ strict: false }).compile(toJsonSchema(output));
		for (const value of ['', 'password=fixture-secret', { configurations: { password: 'fixture-secret', count: '2' } },
			{ content: 'token: fixture-secret' }, [true, 1, null], false, 42, null]) {
			const redacted = redactApolloValue(value);
			expect(output.safeParse(redacted).success).toBe(true);
			expect(validate(redacted)).toBe(true);
		}
		expect(output.safeParse(undefined).success).toBe(false);
	});

	it('validates stable pending/publish envelopes and preserves dynamic change/release values', () => {
		const pending = { ok: true, appId: 'app', env: 'DEV', cluster: 'default', namespace: 'ns', format: 'yaml',
			baseRelease: { id: 9, name: 'r9' }, fingerprint: '123456abcdef', count: 1, modifiedBy: ['alice'],
			changes: [{ key: 'db.password', op: 'update', oldValue: { nested: true }, newValue: ['fixture-secret'] }] };
		const output = ApolloServiceContract.diffNamespaceRelease['~orpc'].outputSchema!;
		expect(output.parse(pending)).toEqual(pending);
		expect(output.safeParse({ ...pending, count: '1' }).success).toBe(false);
		expect(output.safeParse({ ...pending, changes: [{}] }).success).toBe(false);
		const published = { ...pending, dryRun: false, published: true, release: { upstreamExtra: [1, 2] } };
		expect(ApolloServiceContract.publishNamespaceRelease['~orpc'].outputSchema!.parse(published)).toEqual(published);
	});

	it('keeps provider-dependent Portal/Admin payloads unconstrained rather than inventing DTOs', () => {
		for (const name of ['getStatus', 'getPortalNamespace', 'listApp', 'getItem', 'publishRelease', 'request'] as const) {
			const output = ApolloServiceContract[name]['~orpc'].outputSchema!;
			for (const value of [null, undefined, 'text', [{ custom: true }], { versionSpecific: { extension: 1 } }]) {
				expect(output.parse(value)).toEqual(value);
			}
		}
	});
});
