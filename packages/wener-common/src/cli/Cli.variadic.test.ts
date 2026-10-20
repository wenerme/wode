import { expect, test, vi } from 'vitest';
import { Cli } from './Cli';

test('Cli accepts continuous and repeated variadic options', async () => {
	const run = vi.fn();
	const cli = new Cli('test');
	cli.add({ name: 'list', description: 'List', options: [{ name: 'kind', description: '', variadic: true }], run });
	await cli.execute(['list', '--kind=Gen', 'Llm', '--kind', 'Embedding'], {
		stdout: vi.fn(),
		signal: new AbortController().signal,
	});
	expect(run.mock.calls[0]?.[0].options.kind).toEqual(['Gen', 'Llm', 'Embedding']);
});
