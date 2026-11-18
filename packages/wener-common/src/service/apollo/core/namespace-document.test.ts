import { describe, expect, it } from 'vitest';
import { ApolloConnectionConfigSchema } from './config';
import { createApolloService } from './createApolloService';
import { ApolloServiceError, ApolloServiceErrorCodes } from './errors';

const base = '/apps/SampleApp/envs/DEV/clusters/default/namespaces/config.yaml';
const content = 'server:\n  http:\n    addr: example.test:8000 # listen\n';

type PortalOptions = {
	permission?: boolean;
	/** Latest release content; defaults to the draft content (no pending changes). */
	releaseContent?: string;
	putStatus?: number;
	publishStatus?: number;
	format?: string;
};

function createPortal(options: PortalOptions = {}) {
	const requests: Array<{ method: string; path: string; body?: unknown }> = [];
	const fetch = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
		const url = new URL(String(input));
		const method = init.method ?? 'GET';
		requests.push({ method, path: url.pathname, body: init.body ? JSON.parse(String(init.body)) : undefined });
		if (method === 'GET' && url.pathname === base) {
			return Response.json({
				baseInfo: { id: 719 },
				format: options.format ?? 'yaml',
				items: [
					{
						item: { key: 'content', value: content, dataChangeLastModifiedBy: 'teammate' },
						isModified: options.releaseContent !== undefined && options.releaseContent !== content,
					},
				],
			});
		}
		if (method === 'GET' && url.pathname === `${base}/releases/active`) {
			return Response.json([
				{
					id: 4353,
					name: 'base-release',
					dataChangeCreatedBy: 'reviewer',
					configurations: JSON.stringify({ content: options.releaseContent ?? content }),
				},
			]);
		}
		if (method === 'GET' && url.pathname === '/user') return Response.json({ userId: 'operator' });
		if (method === 'GET' && url.pathname.includes('/ns_permissions/'))
			return Response.json({ status: 404 }, { status: 404 });
		if (method === 'GET' && url.pathname.endsWith('/permissions/AssignRole'))
			return Response.json({ hasPermission: true });
		if (method === 'GET' && url.pathname.includes('/permissions/')) {
			return options.permission === undefined
				? new Response('<html>', { status: 502 })
				: Response.json({ hasPermission: options.permission });
		}
		const denied = {
			exception: 'org.springframework.security.access.AccessDeniedException',
			message: 'Access is denied',
			status: 403,
		};
		if (method === 'PUT' && url.pathname === `${base}/items`) {
			const status = options.putStatus ?? 200;
			return status === 200 ? new Response('', { status }) : Response.json({ ...denied, status }, { status });
		}
		if (method === 'POST' && url.pathname === `${base}/releases`) {
			const status = options.publishStatus ?? 200;
			return status === 200 ? Response.json({ id: 42 }) : Response.json({ ...denied, status }, { status });
		}
		return Response.json({ message: 'unexpected' }, { status: 404 });
	}) as typeof globalThis.fetch;
	const config = ApolloConnectionConfigSchema.parse({
		readOnly: false,
		appId: 'SampleApp',
		cluster: 'default',
		env: 'DEV',
		namespace: 'config.yaml',
		operator: 'operator',
		config: { baseUrl: 'http://config.test' },
		admin: { baseUrl: 'http://portal.test' },
		portal: { baseUrl: 'http://portal.test', auth: { type: 'basic', username: 'operator', password: 'portal-secret' } },
	});
	return { requests, service: createApolloService(config, { fetch }) };
}

const otel = {
	set: [
		{ path: 'server.otel.enabled', value: true },
		{ path: 'server.otel.sample_ratio', value: 1 },
	],
};

async function rejected(run: Promise<unknown>): Promise<ApolloServiceError> {
	const error = await run.then(
		() => undefined,
		(value: unknown) => value,
	);
	expect(error).toBeInstanceOf(ApolloServiceError);
	return error as ApolloServiceError;
}

describe('Apollo yaml/json namespace document patch', () => {
	it('previews changes and portal permissions without writing', async () => {
		const { requests, service } = createPortal({ permission: false });
		const result = await service.patchNamespaceDocument({ ...otel, publish: true, dryRun: true });
		expect(result).toMatchObject({
			dryRun: true,
			format: 'yaml',
			applied: 2,
			permission: { user: 'operator', modify: false, release: false, assignRole: true },
			warnings: [expect.stringContaining('ModifyNamespace'), expect.stringContaining('ReleaseNamespace')],
		});
		expect(requests.filter((request) => request.method !== 'GET')).toEqual([]);
	});

	it('writes the edited draft and publishes it through the Portal', async () => {
		const { requests, service } = createPortal({ permission: true });
		const result = await service.patchNamespaceDocument({ ...otel, publish: true, releaseTitle: 'otel' });
		expect(result).toMatchObject({ dryRun: false, applied: 2, published: true, release: { id: 42 } });
		const writes = requests.filter((request) => request.method !== 'GET');
		expect(writes).toEqual([
			{
				method: 'PUT',
				path: `${base}/items`,
				body: {
					namespaceId: 719,
					format: 'yaml',
					configText: `${content}  otel:\n    enabled: true\n    sample_ratio: 1\n`,
				},
			},
			{ method: 'POST', path: `${base}/releases`, body: { releaseTitle: 'otel', isEmergencyPublish: false } },
		]);
	});

	it('refuses to publish before writing when the portal user lacks permission', async () => {
		const { requests, service } = createPortal({ permission: false });
		const error = await rejected(service.patchNamespaceDocument({ ...otel, publish: true }));
		expect(error).toMatchObject({ code: ApolloServiceErrorCodes.PermissionDenied, state: 'permission-precheck' });
		expect(error.message).toContain(
			'lacks ModifyNamespace (修改) + ReleaseNamespace (发布) permission; nothing was written',
		);
		expect(error.message).toContain('portal user: operator');
		expect(error.message).toContain('modify=no release=no');
		expect(error.message).toContain('operator can assign roles in SampleApp');
		expect(error.message).not.toContain('portal-secret');
		expect(requests.some((request) => request.method !== 'GET')).toBe(false);
	});

	it('reports a Portal 403 with status, exception, message and grant hint', async () => {
		const { service } = createPortal({ putStatus: 403 });
		const error = await rejected(service.patchNamespaceDocument(otel));
		expect(error).toMatchObject({
			code: ApolloServiceErrorCodes.PermissionDenied,
			state: 'rejected',
			http: { status: 403, method: 'PUT', path: `${base}/items`, exception: 'AccessDeniedException' },
		});
		expect(error.message.split('\n')[0]).toBe(
			`Apollo namespace draft write rejected: HTTP 403 AccessDeniedException: Access is denied (PUT ${base}/items)`,
		);
		expect(error.message).toContain('portal user: operator; Portal writes run as the signed-in portal user');
		expect(error.message).toContain('operator (operator) is only used by OpenAPI calls');
		expect(error.message).toContain('namespace config.yaml → 授权');
	});

	it('separates a rejected publish from an unknown one after the draft is written', async () => {
		const rejectedPublish = await rejected(
			createPortal({ publishStatus: 403 }).service.patchNamespaceDocument({ ...otel, publish: true }),
		);
		expect(rejectedPublish).toMatchObject({
			code: ApolloServiceErrorCodes.PermissionDenied,
			state: 'publish-rejected',
		});
		expect(rejectedPublish.message).toMatch(/^Apollo namespace draft updated but publish was rejected: HTTP 403/u);
		const unknownPublish = await rejected(
			createPortal({ publishStatus: 500 }).service.patchNamespaceDocument({ ...otel, publish: true }),
		);
		expect(unknownPublish).toMatchObject({
			code: ApolloServiceErrorCodes.PartialFailure,
			state: 'publish-outcome-unknown',
		});
		expect(unknownPublish.message).toMatch(/^Apollo namespace draft updated; publish outcome is unknown: HTTP 500/u);
	});

	it('guards pending drafts, no-op edits and non-document namespaces', async () => {
		const releaseContent = 'server:\n  http:\n    addr: example.test:7000\n';
		const pendingPortal = createPortal({ releaseContent });
		const pending = await rejected(pendingPortal.service.patchNamespaceDocument({ ...otel, publish: true }));
		expect(pending.message).toMatch(
			/draft already has 1 unpublished change\(s\) by teammate \(server\.http\.addr\).*nothing was written/u,
		);
		expect(pendingPortal.requests.some((request) => request.method !== 'GET')).toBe(false);
		const preview = await pendingPortal.service.patchNamespaceDocument({ ...otel, publish: true, dryRun: true });
		expect(preview).toMatchObject({
			baseRelease: { id: 4353, name: 'base-release', releasedBy: 'reviewer' },
			changes: [
				{ key: 'server.otel.enabled', op: 'create', newValue: true },
				{ key: 'server.otel.sample_ratio', op: 'create', newValue: 1 },
			],
			pending: [
				{
					key: 'server.http.addr',
					op: 'update',
					oldValue: 'example.test:7000',
					newValue: 'example.test:8000',
					modifiedBy: 'teammate',
				},
			],
			publishChanges: [
				{ key: 'server.http.addr', op: 'update', oldValue: 'example.test:7000', newValue: 'example.test:8000' },
				{ key: 'server.otel.enabled', op: 'create', newValue: true },
				{ key: 'server.otel.sample_ratio', op: 'create', newValue: 1 },
			],
			warnings: [expect.stringContaining('publish requires --allow-unpublished-draft')],
		});
		const allowed = createPortal({ releaseContent, permission: true });
		await expect(
			allowed.service.patchNamespaceDocument({ ...otel, publish: true, allowUnpublishedDraft: true }),
		).resolves.toMatchObject({ published: true });

		const noop = createPortal();
		await expect(
			noop.service.patchNamespaceDocument({
				set: [{ path: 'server.http.addr', value: 'example.test:8000' }],
				publish: true,
			}),
		).resolves.toMatchObject({ applied: 0, published: false });
		expect(noop.requests.some((request) => request.method !== 'GET')).toBe(false);

		const properties = await rejected(createPortal({ format: 'properties' }).service.patchNamespaceDocument(otel));
		expect(properties).toMatchObject({ code: ApolloServiceErrorCodes.InvalidRequest });
		expect(properties.message).toContain('use item patch instead');
	});
});
