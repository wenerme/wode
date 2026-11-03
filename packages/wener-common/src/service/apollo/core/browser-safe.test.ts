import { describe, expect, it } from 'vitest';
import { ApolloConnectionConfigSchema } from './config';
import { diffApolloValues } from './config-diff';
import { createApolloService } from './createApolloService';
import { editApolloDocument } from './document-edit';
import { encodeApolloUtf8Base64 } from './encoding';
import { createApolloHttpAdapter } from './http-adapter';
import { equalApolloJsonValues } from './json-equality';
import { apolloItemPath } from './operations';

const options = {
	appId: 'SampleApp',
	config: { baseUrl: 'https://config.example.test' },
	admin: { baseUrl: 'https://admin.example.test' },
	portal: { baseUrl: 'https://portal.example.test' },
};

describe('Apollo browser-safe protocols', () => {
	it('encodes Unicode item keys as unpadded base64url and handles large UTF-8 strings', () => {
		const scope = { appId: 'SampleApp', env: 'DEV', cluster: 'default', namespace: 'application' };
		expect(apolloItemPath(scope, '路径/😀?a=1#\\')).toBe(
			'/openapi/v1/envs/DEV/apps/SampleApp/clusters/default/namespaces/application/encodedItems/6Lev5b6EL_CfmIA_YT0xI1w',
		);
		expect(apolloItemPath(scope, '普通😀')).toMatch(/\/items\/%E6%99%AE%E9%80%9A%F0%9F%98%80$/u);
		const text = '大😀'.repeat(100_000);
		const decoded = Uint8Array.from(atob(encodeApolloUtf8Base64(text)), (char) => char.charCodeAt(0));
		expect(new TextDecoder().decode(decoded)).toBe(text);
	});

	it('sends UTF-8 Basic credentials through both HTTP endpoint roles', async () => {
		const auth = { type: 'basic' as const, username: '用户😀', password: '密碼é' };
		const adapter = createApolloHttpAdapter(
			ApolloConnectionConfigSchema.parse({
				...options,
				admin: { ...options.admin, auth },
				portal: { ...options.portal, auth },
			}),
			{
				fetch: async (_input, init) => {
					expect(new Headers(init?.headers).get('authorization')).toBe('Basic 55So5oi38J+YgDrlr4bnorzDqQ==');
					return Response.json({ ok: true });
				},
			},
		);
		for (const role of ['admin', 'portal'] as const) {
			await expect(adapter.request({ role, path: '/apps' })).resolves.toEqual({ ok: true });
		}
	});

	it('compares JSON keys without key order or constructor assumptions and retains array order', () => {
		const left = { a: 1, list: [true, null, { constructor: { x: 2 }, other: 'value' }] };
		const right = { list: [true, null, { other: 'value', constructor: { x: 2 } }], a: 1 };
		expect(equalApolloJsonValues(left, right)).toBe(true);
		expect(equalApolloJsonValues([1, 2], [2, 1])).toBe(false);
		expect(equalApolloJsonValues([], {})).toBe(false);
		expect(equalApolloJsonValues({ key: null }, {})).toBe(false);
		expect(diffApolloValues(left, right)).toEqual([]);
		expect(diffApolloValues([1, 2], [2, 1])).toHaveLength(2);
		const text = JSON.stringify({ data: left });
		const edit = editApolloDocument({ format: 'json', text, set: [{ path: 'data', value: right }] });
		expect(edit.text).toBe(text);
		expect(edit.changes[0]?.changed).toBe('');
	});

	it('counts UTF-8 bytes for namespace previews', async () => {
		const service = createApolloService(options, {
			fetch: async (input) => {
				const path = new URL(String(input)).pathname;
				if (path === '/user') return Response.json({ userId: 'operator' });
				if (path.includes('/permissions/') || path.includes('/ns_permissions/')) {
					return Response.json({ hasPermission: true });
				}
				return Response.json({ baseInfo: { id: 1 }, format: 'properties', items: [] });
			},
		});
		await expect(service.writeNamespaceText({ configText: '字😀\n', dryRun: true })).resolves.toMatchObject({
			ok: true,
			bytes: 8,
		});
	});
});
