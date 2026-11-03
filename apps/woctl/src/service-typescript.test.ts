import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { createMemoryCliConfigStore } from 'common/context';
import { expect, it } from 'vitest';
import { createWocliCli } from './createWocliCli';

it('generates a standalone Apollo service declaration that typechecks', async () => {
	const cli = createWocliCli({ config: createMemoryCliConfigStore({}) });
	const lines: string[] = [];
	await cli.executeLine('svc type apollo --typescript', {
		signal: new AbortController().signal, stdout: (text) => lines.push(text),
	});
	const source = lines.join('\n');
	expect(source).toContain('publishNamespaceRelease(');
	expect(source).not.toContain('string<uri>');
	const directory = await mkdtemp(join(tmpdir(), 'woctl-declaration-'));
	try {
		const filename = join(directory, 'apollo.ts');
		await writeFile(filename, source);
		const compiler = fileURLToPath(new URL('../../../node_modules/typescript/bin/tsc', import.meta.url));
		const result = await promisify(execFile)(process.execPath, [compiler, '--ignoreConfig', '--noEmit', '--strict', '--skipLibCheck', '--target', 'es2022', filename], { timeout: 30000 })
			.catch((error: { stdout?: string; stderr?: string }) => { throw new Error(`${error.stdout ?? ''}${error.stderr ?? ''}`); });
		expect(result.stdout).toBe('');
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
});
