import { build } from 'esbuild';
import { describe, expect, it } from 'vitest';

describe('@wener/common/fs browser boundaries', () => {
	for (const entry of ['./index.ts', './webdav/index.ts', './s3/index.ts', './orpc/index.ts']) {
		it(`bundles ${entry} without Node-only modules`, async () => {
			const result = await build({
				entryPoints: [new URL(entry, import.meta.url).pathname],
				bundle: true,
				format: 'esm',
				metafile: true,
				platform: 'browser',
				write: false,
				logLevel: 'silent',
			});
			const output = result.outputFiles.map((file) => file.text).join('\n');
			const runtimeInputs = Object.keys(result.metafile.inputs);

			expect(output).not.toMatch(/node:/u);
			expect(runtimeInputs.some((path) => path.includes('/fs/server/'))).toBe(false);
		});
	}
});
