import 'fake-indexeddb/auto';
import { describe, expect, it, vi } from 'vitest';
import { subscribeConsoleDemoResourceCounts } from './console-demo-resource-counts';

describe('console demo resource count subscription', () => {
	it('surfaces a failed read and allows a fresh subscription to recover', async () => {
		const errors: unknown[] = [];
		const values: Array<{ account: number; contact: number }> = [];
		const stopFailed = subscribeConsoleDemoResourceCounts({
			read: async () => {
				throw new Error('count unavailable');
			},
			onCounts: (value) => values.push(value),
			onError: (error) => errors.push(error),
		});
		await vi.waitFor(() => expect(errors).toHaveLength(1));
		stopFailed();

		const stopRecovered = subscribeConsoleDemoResourceCounts({
			read: async () => ({ account: 129, contact: 357 }),
			onCounts: (value) => values.push(value),
			onError: (error) => errors.push(error),
		});
		await vi.waitFor(() => expect(values).toEqual([{ account: 129, contact: 357 }]));
		stopRecovered();
	});
});
