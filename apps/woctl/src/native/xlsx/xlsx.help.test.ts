import { Cli } from '@wener/common/cli';
import { describe, expect, it, vi } from 'vitest';
import type { CliExecution } from '../../createCli';
import { createXlsxCommand } from './index';

// A runtime core import would fail this test before WASM could be initialized.
vi.mock('common/xlsx', () => { throw new Error('Help must not load XLSX core or WASM'); });

describe('XLSX discovery', () => {
	it('describes and renders every help path without core import, input, or output files', async () => {
		const cli = new Cli<CliExecution>('test');
		cli.add(createXlsxCommand());
		const stdout = vi.fn();
		const readText = vi.fn(() => { throw new Error('Help must not read input'); });
		const context = { stdout, signal: new AbortController().signal, host: { readText } } as unknown as CliExecution;
		expect(cli.describe()[0].commands).toHaveLength(7);
		for (const name of ['', 'read', 'inspect', 'props', 'properties', 'list', 'sheets', 'edit', 'tidy', 'export']) {
			await cli.execute(['xlsx', ...(name ? [name] : []), '--help'], context);
			expect(stdout.mock.calls.at(-1)?.[0]).toContain('Usage:');
		}
		await cli.execute(['xlsx', 'edit', '--create', '--csv', '-', '--help'], context);
		expect(readText).not.toHaveBeenCalled();
	});
});
