import { createMemoryCliConfigStore } from 'common/context';
import { describe, expect, it } from 'vitest';
import { createWebCli } from './web';

function output() {
	const lines: string[] = [];
	return {
		lines,
		io: {
			signal: new AbortController().signal,
			stdout: (text: string) => {
				lines.push(text);
			},
		},
	};
}

describe('service list effective catalog view (WOC-009)', () => {
	it('marks a known provider instance as the default with no ambiguity', async () => {
		const cli = createWebCli({
			config: createMemoryCliConfigStore({
				services: [{ name: 'system', type: 'system' }],
				defaults: { system: 'system' },
			}),
		});
		const { io, lines } = output();
		await cli.executeLine('service list --json', io);
		const [entry] = JSON.parse(lines.pop() ?? '');
		expect(entry).toMatchObject({
			name: 'system',
			provider: 'system',
			status: 'known',
			disabled: false,
			default: true,
			ambiguous: false,
		});
	});

	it('flags a configured type with no matching provider as unknown', async () => {
		const cli = createWebCli({
			config: createMemoryCliConfigStore({ services: [{ name: 'ghost', type: 'ghost-type' }] }),
		});
		const { io, lines } = output();
		await cli.executeLine('service list --json', io);
		const [entry] = JSON.parse(lines.pop() ?? '');
		expect(entry).toMatchObject({ name: 'ghost', provider: 'ghost-type', status: 'unknown', default: false });
		expect(entry.capabilities).toEqual([]);
	});

	it('flags two enabled instances of the same provider as ambiguous without a unique default', async () => {
		const cli = createWebCli({
			config: createMemoryCliConfigStore({
				services: [
					{ name: 'primary', type: 'system' },
					{ name: 'secondary', type: 'system' },
				],
			}),
		});
		const { io, lines } = output();
		await cli.executeLine('service list --json', io);
		const entries = JSON.parse(lines.pop() ?? '');
		expect(entries.every((entry: { ambiguous: boolean }) => entry.ambiguous)).toBe(true);
		expect(entries.every((entry: { default: boolean }) => !entry.default)).toBe(true);
	});

	it('resolves ambiguity when one of two instances is the explicit default', async () => {
		const cli = createWebCli({
			config: createMemoryCliConfigStore({
				services: [
					{ name: 'primary', type: 'system' },
					{ name: 'secondary', type: 'system' },
				],
				defaults: { system: 'primary' },
			}),
		});
		const { io, lines } = output();
		await cli.executeLine('service list --json', io);
		const entries = JSON.parse(lines.pop() ?? '') as Array<{ name: string; default: boolean; ambiguous: boolean }>;
		const primary = entries.find((entry) => entry.name === 'primary')!;
		const secondary = entries.find((entry) => entry.name === 'secondary')!;
		expect(primary).toMatchObject({ default: true, ambiguous: false });
		expect(secondary).toMatchObject({ default: false, ambiguous: false });
	});

	it('reports a disabled instance without counting it toward ambiguity', async () => {
		const cli = createWebCli({
			config: createMemoryCliConfigStore({
				services: [
					{ name: 'primary', type: 'system' },
					{ name: 'secondary', type: 'system', disabled: true },
				],
			}),
		});
		const { io, lines } = output();
		await cli.executeLine('service list --json', io);
		const entries = JSON.parse(lines.pop() ?? '') as Array<{ name: string; disabled: boolean; ambiguous: boolean }>;
		const primary = entries.find((entry) => entry.name === 'primary')!;
		const secondary = entries.find((entry) => entry.name === 'secondary')!;
		expect(primary.ambiguous).toBe(false);
		expect(secondary).toMatchObject({ disabled: true, ambiguous: false });
	});
});
