import { afterEach, describe, expect, it, vi } from 'vitest';
import { cliTerminalSize, getCliColumns, snapshotCliRuntime } from './CliRuntime';

afterEach(() => vi.unstubAllGlobals());

describe('CliRuntime', () => {
	it('snapshots environment and binds the current global fetch', async () => {
		const fetch = vi.fn(function (this: unknown) {
			expect(this).toBe(globalThis);
			return Promise.resolve(new Response('ok'));
		});
		vi.stubGlobal('fetch', fetch);
		const runtime = snapshotCliRuntime({
			cwd: '/',
			env: { TOKEN: 'not-used' },
			fs: { readFile: async () => new Uint8Array() } as never,
		});
		vi.stubGlobal('fetch', vi.fn());
		expect(await (await runtime.fetch('https://example.test')).text()).toBe('ok');
		expect(Object.isFrozen(runtime)).toBe(true);
		expect(Object.isFrozen(runtime.env)).toBe(true);
	});

	it('uses only explicit terminal data for sizes', () => {
		expect(cliTerminalSize('80')).toBe(80);
		expect(cliTerminalSize('0')).toBeUndefined();
		expect(getCliColumns({ term: { columns: 72 }, env: { COLUMNS: '40' } })).toBe(72);
	});
});
