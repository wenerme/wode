import { describe, expect, it, vi } from 'vitest';
import type { ServiceCliInputContext } from '../cli/ServiceCliDefinition';
import { ServiceCliInputError } from '../cli/ServiceCliInputError';
import { GrafanaCliDefinition } from './cli';
import type { IGrafanaService } from './index';

const operation = (name: string) => GrafanaCliDefinition.commands.find((entry) => entry.name === name)!;
const context = (args: string[] = [], options: ServiceCliInputContext['options'] = {}) => ({
	args, options, readText: vi.fn(async (value: string) => value),
});

describe('Grafana CLI preparation', () => {
	it('exposes the grafana name and gf alias', () => {
		expect(GrafanaCliDefinition.name).toBe('grafana');
		expect(GrafanaCliDefinition.aliases).toContain('gf');
	});

	it('prepares status without requiring arguments or confirmation', async () => {
		const client = { health: vi.fn(async () => ({ database: 'ok' })) } as unknown as IGrafanaService;
		const run = await operation('status').prepare(context());
		await run(client, {});
		expect(client.health).toHaveBeenCalledTimes(1);
	});

	it('prepares whoami without requiring arguments or confirmation', async () => {
		const client = { whoAmI: vi.fn(async () => ({ login: 'admin' })) } as unknown as IGrafanaService;
		const run = await operation('whoami').prepare(context());
		await run(client, {});
		expect(client.whoAmI).toHaveBeenCalledTimes(1);
	});

	it('allows a GET api call without --yes', async () => {
		const client = { request: vi.fn(async () => []) } as unknown as IGrafanaService;
		const run = await operation('api').prepare(context(['/api/search'], { query: 'type=dash-db' }));
		await run(client, {});
		expect(client.request).toHaveBeenCalledWith({ path: '/api/search', method: 'GET', params: { type: 'dash-db' } }, {});
	});

	it('rejects a write method without --yes', async () => {
		await expect(operation('api').prepare(context(['/api/dashboards/db'], { method: 'POST', body: '{}' }))).rejects.toThrow('requires --yes');
	});

	it('accepts a write method with --yes and parses the JSON body', async () => {
		const client = { request: vi.fn(async () => ({ id: 1 })) } as unknown as IGrafanaService;
		const run = await operation('api').prepare(context(['/api/dashboards/db'], { method: 'POST', body: '{"dashboard":{"title":"x"}}', yes: true }));
		await run(client, {});
		expect(client.request).toHaveBeenCalledWith({ path: '/api/dashboards/db', method: 'POST', params: {}, body: { dashboard: { title: 'x' } } }, {});
	});

	it('rejects an invalid JSON body', async () => {
		await expect(operation('api').prepare(context(['/api/dashboards/db'], { method: 'POST', body: 'not json', yes: true }))).rejects.toThrow('valid JSON');
	});

	it('rejects a GET request with a body', async () => {
		await expect(operation('api').prepare(context(['/api/health'], { method: 'GET', body: '{}' }))).rejects.toThrow(ServiceCliInputError);
	});

	it('requires a path argument', async () => {
		await expect(operation('api').prepare(context([]))).rejects.toThrow('path is required');
	});
});
