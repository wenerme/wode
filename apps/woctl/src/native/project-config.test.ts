import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { discoverProjectConfigLayers, findProjectRoot, mergeProjectConfigLayers } from './project-config';

const cleanup: string[] = [];
afterEach(async () => {
	for (const path of cleanup.splice(0)) {
		await import('node:fs/promises').then(({ rm }) => rm(path, { recursive: true, force: true }));
	}
});

describe('project service config lookup', () => {
	it('finds the repository root and merges layers from root to cwd', async () => {
		const root = await mkdtemp(join(tmpdir(), 'woctl-project-'));
		cleanup.push(root);
		const nested = join(root, 'packages', 'app');
		await mkdir(join(root, '.wode'), { recursive: true });
		await mkdir(nested, { recursive: true });
		await mkdir(join(root, '.git'));
		await writeFile(join(root, 'service.yaml'), 'services:\n  - name: observe\n    type: openobserve\ndefaults:\n  services:\n    openobserve: observe\n');
		await writeFile(join(root, '.wode', 'service.yaml'), 'services:\n  - name: observe\n    type: openobserve\n    options:\n      organization: project\n');
		await writeFile(join(nested, 'service.yaml'), 'services:\n  - name: local\n    type: system\n');
		expect(await findProjectRoot(nested)).toBe(root);
		const layers = await discoverProjectConfigLayers({ cwd: nested });
		expect(layers.map((layer) => layer.path)).toEqual([
			join(root, 'service.yaml'),
			join(root, '.wode', 'service.yaml'),
			join(nested, 'service.yaml'),
		]);
		const merged = mergeProjectConfigLayers({ services: {}, defaults: {} }, layers);
		expect(merged.services).toMatchObject({ observe: { options: { organization: 'project' } }, local: { type: 'system' } });
		expect(merged.defaults).toEqual({ openobserve: 'observe' });
	});

	it('does not treat a directory without git root as a project', async () => {
		const root = await mkdtemp(join(tmpdir(), 'woctl-no-project-'));
		cleanup.push(root);
		await writeFile(join(root, 'service.yaml'), 'services: []\n');
		expect(await discoverProjectConfigLayers({ cwd: root })).toEqual([]);
	});
});
