import { createMemoryCliConfigStore } from 'common/context';
import { expect, it } from 'vitest';
import { createCli, createWoctlServiceCommand } from './createCli';

it('uses the service table projection for human output and preserves the original JSON result', async () => {
	const result = { items: [{ name: 'example', value: 'hello' }], durationMs: 1 };
	const cli = createCli({
		config: createMemoryCliConfigStore({ services: [{ name: 'fixture', type: 'fixture' }] }),
		providers: [{
			name: 'fixture',
			create: () => ({
				getSchema: async () => ({ tools: { read: { inputSchema: { type: 'object' }, annotations: { readOnlyHint: true } } } }),
				call: async () => result,
			}),
		}],
		commands: [createWoctlServiceCommand<{ read(input: object): Promise<typeof result> }>({
			name: 'fixture', description: 'Fixture service', commands: [{
				name: 'read', description: 'Read a fixture', prepare: () => (client) => client.read({}),
				table: (value) => ({ headers: ['NAME', 'VALUE'], rows: (value as typeof result).items.map((item) => [item.name, item.value]) }),
			}],
		})],
	});
	const stdout: string[] = [];
	const io = { signal: new AbortController().signal, stdout: (text: string) => stdout.push(text) };
	await cli.executeLine('fixture read', io);
	expect(stdout.at(-1)).toMatch(/^NAME\s+VALUE/u);
	expect(stdout.at(-1)).toContain('example');
	expect(stdout.at(-1)).not.toContain('headers');
	await cli.executeLine('fixture read --json', io);
	expect(JSON.parse(stdout.at(-1)!)).toEqual(result);
});
