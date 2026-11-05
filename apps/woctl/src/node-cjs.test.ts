import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { build } from 'esbuild';
import { expect, it } from 'vitest';

it('bundles a CommonJS private host and resolves document assets from that bundle', async () => {
	const directory = await mkdtemp(join(tmpdir(), 'woctl-node-cjs-'));
	const app = fileURLToPath(new URL('..', import.meta.url));
	try {
		await mkdir(join(directory, 'node_modules'));
		for (const dependency of ['pdfjs-dist', 'excelize-wasm']) {
			await symlink(join(app, 'node_modules', dependency), join(directory, 'node_modules', dependency), 'dir');
		}
		const pdfRuntime = fileURLToPath(new URL('../../../packages/common/src/pdf/runtime.ts', import.meta.url));
		const xlsxRuntime = fileURLToPath(new URL('../../../packages/common/src/xlsx/shared.ts', import.meta.url));
		const outfile = join(directory, 'consumer.cjs');
		await build({
			stdin: { resolveDir: app, loader: 'ts', contents: `
import { existsSync } from 'node:fs';
import { createNativeHost, createCli, createMemoryCliConfigStore } from 'woctl/node';
import { resolvePdfAsset } from ${JSON.stringify(pdfRuntime)};
import { resolveExcelizeWasm } from ${JSON.stringify(xlsxRuntime)};
async function main() {
  const native = createNativeHost({ config: ${JSON.stringify(join(directory, 'missing.yaml'))} });
  const cli = createCli({ ...native, config: createMemoryCliConfigStore({}), env: {},
    commands: [...native.commands, { name: 'internal', description: 'Private fixture', run: (_input, context) => context.stdout('ready') }] });
  const lines = [];
  await cli.executeLine('internal', { signal: new AbortController().signal, stdout: value => lines.push(value) });
  console.log(JSON.stringify({ privateResult: lines, linear: cli.catalog().providers.some(provider => provider.name === 'linear'),
    pdf: existsSync(resolvePdfAsset('pdfjs-dist/package.json')), xlsx: existsSync(resolveExcelizeWasm()) }));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
` },
			bundle: true, platform: 'node', format: 'cjs', target: 'node24', outfile,
			external: ['pg-native', '@hyzyla/pdfium', 'canvaskit-wasm', 'excelize-wasm', 'pdfjs-dist'],
			// The runtime deliberately uses __filename in CJS and import.meta.url in ESM.
			logOverride: { 'empty-import-meta': 'silent' },
		});
		const result = await promisify(execFile)(process.execPath, [outfile], { cwd: directory, timeout: 30000 });
		expect(result.stderr).toBe('');
		expect(JSON.parse(result.stdout)).toEqual({ privateResult: ['ready'], linear: true, pdf: true, xlsx: true });
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
});
