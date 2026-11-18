import { describe, expect, it, vi } from 'vitest';
import type { ServiceCliInputContext } from '../../cli/ServiceCliDefinition';
import type { IFeishuService } from '../IFeishuService';
import { FeishuCliDefinition } from './commands';

const command = (name: string) => {
	const operation = FeishuCliDefinition.commands.find((entry) => entry.group === 'api' && entry.name === name)!;
	return { ...operation, prepare: async (ctx: ServiceCliInputContext) => operation.prepare(ctx) };
};
const context = (args: string[] = [], options: ServiceCliInputContext['options'] = {}) => ({
	args, options, readText: vi.fn(async (value: string) => value),
});
const client = () => ({
	listApi: vi.fn(async () => ({ items: [], total: 0 })),
	describeApi: vi.fn(async () => ({})),
	callReadApi: vi.fn(async () => ({ id: 'x', data: {} })),
	callWriteApi: vi.fn(async () => ({ id: 'x', data: {} })),
}) as unknown as IFeishuService & Record<string, ReturnType<typeof vi.fn>>;

describe('Feishu CLI api commands', () => {
	it('declares dry-run support on api call and keeps api request mutating', () => {
		expect(command('call')).toMatchObject({ supportsDryRun: true });
		expect(command('call').mutating).toBeFalsy();
		expect(command('request').mutating).toBe(true);
	});

	it('maps api list options and validates --risk', async () => {
		const target = client();
		await (await command('list').prepare(context([], { 'api-service': 'im', risk: 'read', search: 'pin', all: true })))(target, {});
		expect(target.listApi).toHaveBeenCalledWith({ service: 'im', risk: 'read', query: 'pin', includeUnavailable: true }, { signal: undefined });
		await expect(command('list').prepare(context([], { risk: 'dangerous' }))).rejects.toThrow('--risk must be one of');
	});

	it('routes read ids to callReadApi without --yes and parses key=value options', async () => {
		const target = client();
		const run = await command('call').prepare(context(['im.pins.list'], { query: ['chat_id=oc_1', 'page_size=20'] }));
		await run(target, {});
		expect(target.callReadApi).toHaveBeenCalledWith({ id: 'im.pins.list', query: { chat_id: 'oc_1', page_size: '20' } }, { signal: undefined });
		const path = await command('call').prepare(context(['im.chats.get'], { path: ['chat_id=oc_1'], query: ['a=1', 'a=2'] }));
		await path(target, {});
		expect(target.callReadApi).toHaveBeenLastCalledWith({ id: 'im.chats.get', path: { chat_id: 'oc_1' }, query: { a: ['1', '2'] } }, { signal: undefined });
		await expect(command('call').prepare(context(['im.chats.get'], { path: ['chat_id'] }))).rejects.toThrow('key=value');
		await expect(command('call').prepare(context(['im.nothing.here']))).rejects.toThrow('Unknown Feishu API');
	});

	it('requires --yes, then --confirm-high-risk, before reading --data', async () => {
		const write = context(['im.pins.create'], { data: '@pin.json' });
		await expect(command('call').prepare(write)).rejects.toThrow('requires --yes');
		expect(write.readText).not.toHaveBeenCalled();
		const highRisk = context(['im.messages.delete'], { path: ['message_id=om_1'], data: '@x.json', yes: true });
		await expect(command('call').prepare(highRisk)).rejects.toThrow('requires --confirm-high-risk');
		expect(highRisk.readText).not.toHaveBeenCalled();

		const target = client();
		const ok = context(['im.pins.create'], { data: '{"message_id":"om_1"}', yes: true });
		await (await command('call').prepare(ok))(target, {});
		expect(target.callWriteApi).toHaveBeenCalledWith({ id: 'im.pins.create', body: { message_id: 'om_1' } }, { signal: undefined });
		await (await command('call').prepare(context(['im.messages.delete'], { path: ['message_id=om_1'], yes: true, 'confirm-high-risk': true })))(target, {});
		expect(target.callWriteApi).toHaveBeenLastCalledWith({ id: 'im.messages.delete', path: { message_id: 'om_1' }, confirmHighRisk: true }, { signal: undefined });
		await expect(command('call').prepare(context(['im.pins.create'], { data: 'not json', yes: true }))).rejects.toThrow('valid JSON');
	});

	it('dry runs need no confirmation and pass dryRun to the service', async () => {
		const target = client();
		await (await command('call').prepare(context(['im.messages.delete'], { path: ['message_id=om_1'], 'dry-run': true })))(target, {});
		expect(target.callWriteApi).toHaveBeenCalledWith({ id: 'im.messages.delete', path: { message_id: 'om_1' }, dryRun: true }, { signal: undefined });
	});
});
