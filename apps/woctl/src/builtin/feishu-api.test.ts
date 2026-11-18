import { createMemoryCliConfigStore } from 'common/context';
import { expect, it, vi } from 'vitest';
import { createCli } from '../createCli';

function setup() {
	const fetch = vi.fn(async (input: unknown) => String(input).includes('tenant_access_token')
		? Response.json({ code: 0, tenant_access_token: 'fixture-token', expire: 7200 })
		: Response.json({ code: 0, data: { chat_id: 'oc_1', name: 'Team' } }));
	const cli = createCli({
		config: createMemoryCliConfigStore({
			services: [{ name: 'chat', type: 'feishu', options: { appIdEnv: 'FEISHU_APP_ID', appSecretEnv: 'FEISHU_APP_SECRET' } }],
		}),
		fetch: fetch as unknown as typeof globalThis.fetch,
		getEnv: (name: string) => ({ FEISHU_APP_ID: 'cli_fixture', FEISHU_APP_SECRET: 'fixture-secret' } as Record<string, string>)[name],
	});
	const stdout: string[] = [];
	const io = { signal: new AbortController().signal, stdout: (text: string) => stdout.push(text) };
	return { cli, fetch, stdout, io };
}

it('lists, dry-runs and reads catalog APIs on a read-only service; real writes stay blocked', async () => {
	const { cli, fetch, stdout, io } = setup();
	await cli.executeLine('feishu api list --api-service im --risk read --json', io);
	expect(JSON.parse(stdout.at(-1)!).items.length).toBeGreaterThan(0);
	await cli.executeLine('feishu api call im.messages.delete --path message_id=om_1 --dry-run --json', io);
	expect(JSON.parse(stdout.at(-1)!)).toEqual({
		id: 'im.messages.delete', dryRun: true, request: { method: 'DELETE', path: '/open-apis/im/v1/messages/om_1', query: {} },
	});
	await expect(cli.executeLine(`feishu api call im.pins.create --data '{"message_id":"om_1"}' --json`, io)).rejects.toThrow('requires --yes');
	await expect(cli.executeLine(`feishu api call im.pins.create --data '{"message_id":"om_1"}' --yes --json`, io)).rejects.toThrow('read-only');
	await expect(cli.executeLine('feishu api request GET im/v1/chats --yes', io)).rejects.toThrow('read-only');
	expect(fetch).not.toHaveBeenCalled();
	await cli.executeLine('feishu api call im.chats.get --path chat_id=oc_1 --json', io);
	expect(JSON.parse(stdout.at(-1)!)).toEqual({ id: 'im.chats.get', data: { chat_id: 'oc_1', name: 'Team' } });
	expect(String(fetch.mock.calls.at(-1)![0])).toBe('https://open.feishu.cn/open-apis/im/v1/chats/oc_1');
});
