import { describe, expect, it, vi } from 'vitest';
import { createWocliWebCli } from '../web';

describe('render commands', () => {
	it('uses host stdin/file ports and supports output file semantics', async () => {
		const stdout = vi.fn();
		const writeText = vi.fn(async () => {});
		const cli = createWocliWebCli({ readText: async () => '{"n":1}', writeText });
		const io = { signal: new AbortController().signal, stdout };
		await cli.executeLine('render package.json', io);
		expect(stdout).toHaveBeenLastCalledWith('{\n  "n": 1\n}\n');
		await cli.executeLine('render - --input json --format yaml -o output.yaml', io);
		expect(writeText).toHaveBeenCalledWith('output.yaml', 'n: 1\n', expect.objectContaining({ signal: io.signal }));
	});
	it('runs inline Markdown offline and rejects invalid render arguments before writing', async () => {
		const stdout = vi.fn();
		const cli = createWocliWebCli();
		const io = { signal: new AbortController().signal, stdout };
		await cli.executeLine('md --text "# Title" --no-color', io);
		expect(stdout).toHaveBeenLastCalledWith('Title\n');
		await expect(cli.executeLine('render --text hello --width 0', io)).rejects.toThrow('width');
		await expect(cli.executeLine('render --text hello -o output.txt', io)).rejects.toThrow('file output');
	});
});
