import { describe, expect, it, vi } from 'vitest';
import type { ServiceCliInputContext } from '../cli/ServiceCliDefinition';
import { PrometheusCliDefinition } from './cli';
import type { IPrometheusService } from './index';

const operation = (name: string) => PrometheusCliDefinition.commands.find((entry) => entry.name === name)!;
const context = (args: string[] = [], options: ServiceCliInputContext['options'] = {}) => ({
	args, options, readText: vi.fn(async () => '  sum(up)\n'),
});

describe('Prometheus CLI preparation', () => {
	it.each(['query', 'query-range'])('prepares bounded %s input before invoking a service', async (name) => {
		const input = context([], { query: '@query.promql', timeout: '30s' });
		const client = { query: vi.fn(async () => ({ status: 'success', data: {} })), queryRange: vi.fn(async () => ({ status: 'success', data: {} })) };
		const run = await operation(name).prepare(input);
		expect(input.readText).toHaveBeenCalledExactlyOnceWith('@query.promql', { label: 'Prometheus query', maxBytes: 16 * 1024 * 1024 });
		expect(client.query).not.toHaveBeenCalled();
		expect(client.queryRange).not.toHaveBeenCalled();
		await run(client as unknown as IPrometheusService, {});
		expect(name === 'query' ? client.query : client.queryRange).toHaveBeenCalledWith(expect.objectContaining({ query: 'sum(up)', timeout: '30s' }), {});
	});

	it('preserves range defaults, relative times, ISO times and duration steps', async () => {
		vi.spyOn(Date, 'now').mockReturnValue(1_800_000_000_000);
		try {
			const queryRange = vi.fn(async () => ({ status: 'success', data: {} }));
			const client = { queryRange } as unknown as IPrometheusService;
			await (await operation('query-range').prepare(context(['sum(', 'up', ')'])))(client, {});
			expect(queryRange).toHaveBeenLastCalledWith({ query: 'sum( up )', start: 1_799_996_400, end: 1_800_000_000, step: 60 }, {});
			await (await operation('query-range').prepare(context([], { query: 'up', start: 'now-5m', end: '2027-01-15T08:00:00Z', step: '30s' })))(client, {});
			expect(queryRange).toHaveBeenLastCalledWith({ query: 'up', start: 1_799_999_700, end: Date.parse('2027-01-15T08:00:00Z') / 1000, step: '30s' }, {});
		} finally {
			vi.restoreAllMocks();
		}
	});

	it.each(['query', 'query-range'])('keeps positional %s expressions literal', async (name) => {
		const input = context(['@literal']);
		await operation(name).prepare(input);
		expect(input.readText).not.toHaveBeenCalled();
	});

	it.each(['query', 'query-range'])('rejects %s source conflicts explicitly', async (name) => {
		const input = context(['up'], { query: '-' });
		await expect(async () => operation(name).prepare(input)).rejects.toThrow('positional query conflicts with --query');
		expect(input.readText).not.toHaveBeenCalled();
	});
});
