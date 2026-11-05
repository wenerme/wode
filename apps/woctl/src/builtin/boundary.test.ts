import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { expect, it } from 'vitest';

it('keeps the browser-safe provider source entry independent of CLI definitions and builders', async () => {
	const result = await build({
		entryPoints: [fileURLToPath(new URL('./index.ts', import.meta.url))],
		bundle: true, write: false, platform: 'browser', format: 'esm', metafile: true,
	});
	// The existing shared safe-input error is not a CLI definition or assembler.
	expect(Object.keys(result.metafile!.inputs).filter((path) =>
		/\/service\/(?:[^/]+\/)?cli(?:\/|\.ts$)/u.test(path) && !path.endsWith('/ServiceCliInputError.ts'),
	)).toEqual([]);
});
