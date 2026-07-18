import { build } from 'esbuild';
import { describe, expect, it } from 'vite-plus/test';

describe('@wener/common/fs/just-bash browser bundle', () => {
	it('bundles without resolving the optional just-bash runtime or node:zlib', async () => {
		const result = await build({
			entryPoints: [new URL('./index.ts', import.meta.url).pathname],
			bundle: true,
			format: 'esm',
			metafile: true,
			platform: 'browser',
			write: false,
			logLevel: 'silent',
		});
		const output = result.outputFiles.map((file) => file.text).join('\n');
		const runtimeInputs = Object.keys(result.metafile.inputs);

		expect(output).not.toContain('node:zlib');
		expect(runtimeInputs.some((path) => path.includes('/just-bash@') || path.includes('just-bash/dist/'))).toBe(false);
	});
});
