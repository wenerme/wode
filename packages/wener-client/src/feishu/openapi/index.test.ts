import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	buildFeishuApiRequest,
	classifyFeishuApiRisk,
	FeishuApiIndex,
	FeishuApiServices,
	loadFeishuApi,
	loadFeishuApiService,
} from './index';

const metaPath = process.env.FEISHU_OPENAPI_META || '';
const hasMeta = Boolean(metaPath) && existsSync(metaPath);

describe('Feishu OpenAPI index', () => {
	it('has unique ids and full paths', () => {
		const ids = FeishuApiIndex.map((v) => v.id);
		expect(new Set(ids).size).toBe(ids.length);
		for (const v of FeishuApiIndex) {
			expect(v.id).toBe(`${v.service}.${v.resource}.${v.method}`);
			expect(v.path.startsWith('/open-apis/')).toBe(true);
			expect(['read', 'write', 'high-risk-write']).toContain(v.risk);
			expect(v.summary).not.toMatch(/\n/);
		}
		expect(ids).toContain('im.chat.members.create');
	});

	it('every entry has a loadable definition', async () => {
		for (const s of FeishuApiServices) {
			const defs = await loadFeishuApiService(s.name);
			expect(defs.length).toBe(FeishuApiIndex.filter((v) => v.service === s.name).length);
		}
		const def = await loadFeishuApi('im.chat.members.create');
		expect(def.pathParams).toBeDefined();
		await expect(loadFeishuApi('nope.x.y')).rejects.toThrow();
		await expect(loadFeishuApiService('toString')).rejects.toThrow();
	});

	it.skipIf(!hasMeta)('counts match metadata', () => {
		const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
		let n = 0;
		for (const s of meta.services) for (const r of Object.values<any>(s.resources)) n += Object.keys(r.methods).length;
		expect(FeishuApiIndex.length).toBe(n);
		expect(FeishuApiServices.length).toBe(meta.services.length);
	});
});

describe('Feishu OpenAPI schemas', () => {
	it('response is lenient: all optional, unknown fields kept, enums open', async () => {
		const def = await loadFeishuApi('approval.instances.get');
		const ok = def.response!.parse({
			status: 'SOMETHING_NEW',
			operation_records: [{ type: 'PASS', extra: 1 }],
			vendor_field: true,
		}) as any;
		expect(ok.vendor_field).toBe(true);
		expect(ok.operation_records[0].extra).toBe(1);
		expect(def.response!.safeParse({}).success).toBe(true);
		expect(def.response!.safeParse({ department_id: 1 }).success).toBe(false);
	});

	it('query/path coerce strings, enums strict', async () => {
		const def = await loadFeishuApi('im.chat.members.get');
		expect(def.query!.parse({ page_size: '20', check_security_conf: 'false' })).toMatchObject({
			page_size: 20,
			check_security_conf: false,
		});
		expect(def.query!.parse({ check_security_conf: true })).toMatchObject({ check_security_conf: true });
		expect(def.query!.safeParse({ page_size: 'x' }).success).toBe(false);
		expect(def.query!.safeParse({ member_id_type: 'bad' }).success).toBe(false);
		expect(def.pathParams!.parse({ chat_id: 123 })).toEqual({ chat_id: '123' });
		expect(def.pathParams!.safeParse({}).success).toBe(false);
	});

	it('treats blank numeric params as absent, wraps single list values and rejects unknown path keys', async () => {
		const members = await loadFeishuApi('im.chat.members.get');
		expect(members.query!.safeParse({ page_size: '' }).success).toBe(false);
		expect(members.query!.safeParse({ page_size: 'x' }).success).toBe(false);
		expect(members.query!.parse({ page_size: '20' })).toMatchObject({ page_size: 20 });
		expect(members.pathParams!.safeParse({ chat_id: 'oc_1', typo: 'x' }).success).toBe(false);
		const download = await loadFeishuApi('mail.user_mailbox.message.attachments.download_url');
		expect(download.query!.parse({ attachment_ids: 'a' })).toMatchObject({ attachment_ids: ['a'] });
		expect(download.query!.parse({ attachment_ids: ['a', 'b'] })).toMatchObject({ attachment_ids: ['a', 'b'] });
	});

	it('body keeps required and strict types', async () => {
		const def = await loadFeishuApi('im.pins.create');
		expect(def.body!.safeParse({}).success).toBe(false);
		expect(def.body!.safeParse({ message_id: 1 }).success).toBe(false);
		expect((def.body!.parse({ message_id: 'om', extra: 1 }) as any).extra).toBe(1);
	});
});

describe('buildFeishuApiRequest', () => {
	const def = { httpMethod: 'post', path: '/open-apis/im/v1/chats/{chat_id}/members' };
	it('encodes path and query', () => {
		expect(
			buildFeishuApiRequest(def, { path: { chat_id: 'oc a?b' }, query: { a: 1, b: undefined, c: [1, 2] }, body: {} }),
		).toEqual({
			method: 'POST',
			path: '/open-apis/im/v1/chats/oc%20a%3Fb/members',
			query: { a: '1', c: ['1', '2'] },
			body: {},
		});
	});
	it.each([undefined, '', '.', '..', 'a/b', 'a\\b', {}])('rejects %j', (chat_id) => {
		expect(() => buildFeishuApiRequest(def, { path: { chat_id } })).toThrow();
	});
	it('classifies risk', () => {
		expect(classifyFeishuApiRisk('read')).toEqual({ readOnly: true, destructive: false });
		expect(classifyFeishuApiRisk('write')).toEqual({ readOnly: false, destructive: false });
		expect(classifyFeishuApiRisk('high-risk-write')).toEqual({ readOnly: false, destructive: true });
	});
});

describe.skipIf(!hasMeta)('generator', () => {
	it('--check passes', () => {
		const root = path.resolve(__dirname, '../../../../..');
		execFileSync(
			process.execPath,
			['--import', 'tsx', 'packages/wener-client/scripts/generate-feishu-openapi.ts', '--meta', metaPath, '--check'],
			{ cwd: root, stdio: 'pipe' },
		);
	}, 60_000);
});
