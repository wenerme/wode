import { describe, expect, it, vi } from 'vite-plus/test';
import {
	createConsoleDemoAutomationDatabaseName,
	scheduleConsoleDemoRuntimeDispose,
} from './console-demo-data-runtime';

describe('ConsoleDemoDataProvider lifecycle', () => {
	it('creates isolated automation database names', () => {
		expect(createConsoleDemoAutomationDatabaseName(() => 'first')).toBe(
			'wener-components-console-demo-automation-first',
		);
		expect(createConsoleDemoAutomationDatabaseName(() => 'second')).toBe(
			'wener-components-console-demo-automation-second',
		);
	});

	it('defers collection cleanup until child unmount cleanup can finish', async () => {
		const dispose = vi.fn(async () => undefined);
		const scheduled: Array<() => void> = [];
		scheduleConsoleDemoRuntimeDispose({ dispose }, (callback) => scheduled.push(callback));
		expect(dispose).not.toHaveBeenCalled();
		expect(scheduled).toHaveLength(1);
		scheduled[0]?.();
		await vi.waitFor(() => expect(dispose).toHaveBeenCalledOnce());
	});
});
