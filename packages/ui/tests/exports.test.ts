import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const packageRoot = path.resolve(import.meta.dirname, '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8')) as {
	exports: Record<string, string>;
	publishConfig: { exports: Record<string, string | { types: string; default: string }> };
};

describe('@wener/ui export contract', () => {
	it('keeps every source family and publish export aligned', () => {
		for (const [subpath, sourceTarget] of Object.entries(packageJson.exports)) {
			if (subpath === './package.json') continue;
			expect(fs.existsSync(path.join(packageRoot, sourceTarget))).toBe(true);

			const publishTarget = packageJson.publishConfig.exports[subpath];
			expect(publishTarget).toBeDefined();
			if (typeof publishTarget === 'string') continue;
			expect(publishTarget.types).toBe(sourceTarget);
			expect(publishTarget.default).toMatch(/^\.\/lib\/.+\.js$/);
		}
	});

	it('does not expose implementation files outside family indexes', () => {
		for (const [subpath, target] of Object.entries(packageJson.exports)) {
			if (subpath === '.' || subpath === './package.json') continue;
			expect(target).toMatch(/^\.\/src\/[a-z0-9-]+\/index\.ts$/);
		}
	});

	it('loads every built publish entry', async () => {
		for (const [subpath, target] of Object.entries(packageJson.publishConfig.exports)) {
			if (subpath === './package.json') continue;
			const publishTarget = typeof target === 'string' ? target : target.default;
			const publishPath = path.join(packageRoot, publishTarget);
			expect(fs.existsSync(publishPath), `${subpath} -> ${publishTarget}`).toBe(true);

			const module = await import(/* @vite-ignore */ pathToFileURL(publishPath).href);
			expect(Object.keys(module).length, subpath).toBeGreaterThan(0);
		}
	});
});
