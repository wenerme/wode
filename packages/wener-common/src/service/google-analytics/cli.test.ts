import { describe, expect, it, vi } from 'vitest';
import { ServiceCliInputError } from '../cli/ServiceCliInputError';
import type { ServiceRuntimeClient } from '../runtime/types';
import { GoogleAnalyticsCliDefinition, googleAnalyticsAccountTable, googleAnalyticsReportTable } from './cli';
import { createGoogleAnalyticsServiceToolClient } from './client';
import type { IGoogleAnalyticsService } from './IGoogleAnalyticsService';

const report = {
	dimensionHeaders: [{ name: 'date' }],
	metricHeaders: [{ name: 'activeUsers', type: 'TYPE_INTEGER' }],
	rows: [{ dimensionValues: [{ value: '20261001' }], metricValues: [{ value: '42' }] }],
	rowCount: 3,
};

function operation(name: string) {
	const found = GoogleAnalyticsCliDefinition.commands.find((item) => `${'group' in item ? `${item.group} ` : ''}${item.name}` === name);
	if (!found) throw new Error(`missing operation ${name}`);
	return found;
}

function service() {
	return {
		listAccountSummaries: vi.fn(async () => ({})),
		getProperty: vi.fn(async () => ({})),
		getMetadata: vi.fn(async () => ({})),
		runReport: vi.fn(async () => report),
		runRealtimeReport: vi.fn(async () => report),
	};
}
const prepare = async (name: string, options: Record<string, string | string[]>) => operation(name).prepare({ args: [], options, readText: async (value) => value });

describe('Google Analytics CLI definition', () => {
	it('exposes the ga alias and expected commands', () => {
		expect(GoogleAnalyticsCliDefinition.aliases).toEqual(['ga']);
		expect(GoogleAnalyticsCliDefinition.commands.map((c) => `${'group' in c ? `${c.group} ` : ''}${c.name}`)).toEqual([
			'status',
			'report run',
			'report realtime',
			'metadata property',
			'metadata list',
		]);
	});

	it('normalizes report input in prepare with default date range', async () => {
		const client = service();
		const run = await prepare('report run', { property: 'properties/123', dimension: ['date'], metric: ['activeUsers'], limit: '10' });
		expect(client.runReport).not.toHaveBeenCalled();
		await run(client as unknown as IGoogleAnalyticsService, {});
		expect(client.runReport).toHaveBeenCalledWith(
			{ propertyId: '123', dateRanges: [{ startDate: '28daysAgo', endDate: 'yesterday' }], dimensions: ['date'], metrics: ['activeUsers'], limit: 10 },
			{ signal: undefined },
		);
		await (await prepare('status', {}))(client as unknown as IGoogleAnalyticsService, {});
		expect(client.listAccountSummaries).toHaveBeenCalledWith({}, { signal: undefined });
	});

	it('fails before service resolution without echoing input values', async () => {
		await expect(prepare('report run', { metric: ['activeUsers'], dimension: ['date'] })).rejects.toThrow('--property is required');
		await expect(prepare('report realtime', { property: '1', dimension: ['date'] })).rejects.toThrow('--metric is required at least once');
		await expect(prepare('metadata list', { property: 'G-SECRETVALUE' })).rejects.toSatisfy(
			(error: unknown) => error instanceof ServiceCliInputError && !String(error).includes('SECRETVALUE'),
		);
		await expect(prepare('report run', { property: '1', dimension: ['d'], metric: ['m'], limit: '0' })).rejects.toThrow('--limit must be between 1 and 250000');
	});

	it('projects report and account tables', () => {
		expect(googleAnalyticsReportTable(report)).toMatchObject({ headers: ['date', 'activeUsers'], rows: [['20261001', '42']], footer: '1 of 3 rows' });
		expect(
			googleAnalyticsAccountTable({ accountSummaries: [{ account: 'accounts/1', displayName: 'Demo', propertySummaries: [{ property: 'properties/2', displayName: 'Web' }] }] }).rows,
		).toEqual([['Demo', 'accounts/1', 'Web', 'properties/2']]);
	});
});

describe('createGoogleAnalyticsServiceToolClient', () => {
	function runtime(call: ServiceRuntimeClient['call'], tools = ['listAccountSummaries', 'getProperty', 'getMetadata', 'runReport', 'runRealtimeReport']) {
		return {
			getSchema: vi.fn(async () => ({ tools: Object.fromEntries(tools.map((name) => [name, { inputSchema: {} }])) })),
			call: vi.fn(call),
		} as unknown as ServiceRuntimeClient & { call: ReturnType<typeof vi.fn> };
	}

	it('applies the default input and validates output', async () => {
		const transport = runtime(async () => ({ accountSummaries: [] }));
		const client = await createGoogleAnalyticsServiceToolClient(transport, 'analytics');
		await expect(client.listAccountSummaries()).resolves.toEqual({ accountSummaries: [] });
		expect(transport.call).toHaveBeenCalledWith(
			{ params: { service: 'analytics' }, body: { toolName: 'listAccountSummaries', input: {} } },
			expect.objectContaining({ signal: expect.any(AbortSignal) }),
		);
		const bad = await createGoogleAnalyticsServiceToolClient(runtime(async () => ({ rowCount: 'x' })), 'analytics');
		await expect(bad.runReport({ propertyId: '1', dateRanges: [{ startDate: 'a', endDate: 'b' }], dimensions: ['d'], metrics: ['m'] })).rejects.toThrow('Invalid Google Analytics response');
		await client.close();
		await bad.close();
	});

	it('handles timeout, close, sync throw and missing operations', async () => {
		const hanging = await createGoogleAnalyticsServiceToolClient(runtime(() => new Promise(() => undefined)), 'analytics');
		await expect(hanging.getProperty({ propertyId: '1' }, { context: { timeoutMs: 5 } })).rejects.toThrow('timed out');
		const pending = hanging.getProperty({ propertyId: '1' });
		await hanging.close();
		await expect(pending).rejects.toThrow('closed');
		await hanging.close();

		const throwing = await createGoogleAnalyticsServiceToolClient(runtime(() => { throw new Error('sync failure'); }), 'analytics');
		await expect(throwing.getMetadata({ propertyId: '1' })).rejects.toThrow('sync failure');
		await throwing.close();

		const partial = await createGoogleAnalyticsServiceToolClient(runtime(async () => ({}), ['getProperty']), 'analytics');
		await expect(partial.getMetadata({ propertyId: '1' })).rejects.toThrow('unavailable');
		await expect(partial.getProperty({ propertyId: 'nope' })).rejects.toThrow('Invalid Google Analytics input');
		await partial.close();
	});
});
