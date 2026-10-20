import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { build } from 'esbuild';
import { expect, it } from 'vitest';

it('builds and executes the Web SDK without process, Buffer, require or Node providers', async () => {
	const bundle = await build({
		entryPoints: [fileURLToPath(new URL('./web.ts', import.meta.url))],
		bundle: true,
		platform: 'browser',
		format: 'iife',
		globalName: 'Wocli',
		write: false,
		metafile: true,
	});
	const inputs = Object.keys(bundle.metafile?.inputs ?? {});
	expect(inputs.some((path) => /commander|@orpc\/server|mikro-orm|src\/node\//.test(path))).toBe(false);
	const lines: string[] = [];
	const sandbox = {
		lines,
		AbortController,
		AbortSignal,
		TextEncoder,
		TextDecoder,
		URL,
		Headers,
		Response,
		Request,
		structuredClone,
		fetch: async () => {
			throw new Error('Offline test must not access the network');
		},
	};
	const result = runInNewContext(
		`${bundle.outputFiles[0].text}\n(async () => {
			const cli = Wocli.createWocliWebCli({ config: Wocli.createMemoryCliConfigStore({ services: [{ name: 'system', type: 'system' }] }) });
			const io = {signal: new AbortController().signal, stdout: text => lines.push(text)};
			await cli.executeLine('system echo "web-bundle" --json', io);
			await cli.executeLine('markdown --text "# Web render"', io);
			await cli.executeLine('prompt import greet --text "Hello {{name}}"', io);
			await cli.executeLine('prompt render greet --var name=web', io);
			await cli.executeLine('prompt --var name=web render greet', io);
			const config = Wocli.createMemoryCliConfigStore({
				currentContext: 'empty',
				contexts: {empty: {services: []}, active: {services: [{name: 'system', type: 'system'}]}}
			});
			const selected = Wocli.createWocliWebCli({config});
			const localIO = {signal: new AbortController().signal, stdout: () => {}};
			const before = (await selected.describe()).map(command => command.name);
			await selected.executeLine('context use active', localIO);
			const after = (await selected.describe()).map(command => command.name);
			const overridden = (await selected.describe({context: 'empty'})).map(command => command.name);
			let blocked = false;
			try { await selected.executeLine('system info --context empty', localIO); }
			catch { blocked = true; }
			return {before, after, overridden, blocked};
		})()`,
		sandbox,
	);
	const visibility = await result;
	expect(visibility.before).not.toContain('system');
	expect(visibility.after).toContain('system');
	expect(visibility.overridden).not.toContain('system');
	expect(visibility.blocked).toBe(true);
	expect(JSON.parse(lines[0] ?? '')).toEqual({ text: 'web-bundle' });
	expect(lines[1]).toBe('Web render\n');
	expect(lines.at(-1)).toBe('Hello web');
	expect(Object.hasOwn(sandbox, 'process')).toBe(false);
	expect(Object.hasOwn(sandbox, 'Buffer')).toBe(false);
	expect(Object.hasOwn(sandbox, 'require')).toBe(false);
});
