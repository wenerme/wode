import { mkdtemp, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { parse } from 'yaml';
import { createFileConfigStore } from './config';

vi.mock('node:fs/promises', async (importOriginal) => {
	const actual = await importOriginal<typeof import('node:fs/promises')>();
	return { ...actual, rename: vi.fn(actual.rename) };
});

async function fixture(run: (directory: string, base: string) => Promise<void>) {
	const directory = await mkdtemp(join(tmpdir(), 'wocli-native-store-'));
	try {
		await run(directory, join(directory, 'config.yaml'));
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
}

describe('native file config store', () => {
	it.each(['local', 'dev'])(
		'materializes implicit local while %s is selected and rejects existing overlays',
		async (selected) => {
			await fixture(async (directory, base) => {
				const store = createFileConfigStore(base);
				if (selected === 'dev') await writeFile(join(directory, 'config.dev.yaml'), '{}\n');
				await store.createContext('local', { context: selected });
				expect(parse(await readFile(join(directory, 'config.local.yaml'), 'utf8'))).toEqual({
					services: [],
					defaults: { services: {} },
				});
				await expect(stat(base)).rejects.toMatchObject({ code: 'ENOENT' });
				await expect(store.createContext('local')).rejects.toThrow('already exists');
			});
		},
	);
	it('writes a selected overlay, creates a context, and switches the base in separate saves', async () => {
		await fixture(async (directory, base) => {
			const store = createFileConfigStore(base);
			let config = await store.load();
			expect(config.services).toEqual({});
			expect(await readdir(directory)).toEqual([]);
			config.contexts.local.services.demo = { provider: 'system', readOnly: true };
			await store.save(config);
			await expect(stat(base)).rejects.toMatchObject({ code: 'ENOENT' });
			const local = join(directory, 'config.local.yaml');
			expect(parse(await readFile(local, 'utf8')).services).toEqual([{ name: 'demo', type: 'system', readOnly: true }]);
			expect((await stat(local)).mode & 0o777).toBe(0o600);
			config = await store.load();
			config.contexts.test = { services: {}, defaults: {} };
			await store.save(config);
			config = await store.load({ context: 'test' });
			expect(config.currentContext).toBe('local');
			config.currentContext = 'test';
			await store.save(config);
			expect((await store.load()).currentContext).toBe('test');
			expect((await stat(base)).mode & 0o777).toBe(0o600);
			expect(parse(await readFile(base, 'utf8'))).not.toHaveProperty('contexts');
		});
	});
	it('enumerates unselected files without reading them and rejects placeholder edits', async () => {
		await fixture(async (directory, base) => {
			const other = join(directory, 'config.other.yaml');
			await writeFile(other, 'fixture-secret: [');
			const store = createFileConfigStore(base);
			const config = await store.load();
			expect(config.contexts.other).toEqual({ services: {}, defaults: {} });
			config.contexts.other.title = 'unauthorized-placeholder-edit';
			await expect(store.save(config)).rejects.toThrow('unloaded');
			await expect(store.load({ context: 'other' })).rejects.toThrow(
				'context configuration (config.other.yaml): Invalid YAML',
			);
			await expect(store.load({ context: 'missing' })).rejects.toThrow('does not exist');
			await expect(store.load({ context: '../escape' })).rejects.toThrow('Invalid context');
			expect(await readFile(other, 'utf8')).toBe('fixture-secret: [');
		});
	});
	it('rejects multiple document changes before creating any directory', async () => {
		await fixture(async (directory) => {
			const nested = join(directory, 'absent');
			const store = createFileConfigStore(join(nested, 'config.yaml'));
			const config = await store.load();
			config.contexts.local.title = 'local';
			config.contexts.other = { services: {}, defaults: {} };
			await expect(store.save(config)).rejects.toThrow('multiple documents');
			await expect(stat(nested)).rejects.toMatchObject({ code: 'ENOENT' });
		});
	});
	it('keeps separate revisions for snapshots from the same store', async () => {
		await fixture(async (directory, base) => {
			const store = createFileConfigStore(base);
			const first = await store.load();
			const stale = await store.load();
			first.contexts.local.title = 'first';
			await store.save(first);
			stale.contexts.local.title = 'stale';
			await expect(store.save(stale)).rejects.toThrow('changed since load');
			expect(parse(await readFile(join(directory, 'config.local.yaml'), 'utf8')).title).toBe('first');
			expect(await readdir(directory)).toEqual(['config.local.yaml']);
		});
	});
	it('does not remove foreign locks and cleans owned locks and temporary files after failed rename', async () => {
		await fixture(async (directory, base) => {
			const store = createFileConfigStore(base);
			const config = await store.load();
			config.contexts.local.title = 'retry';
			const lock = join(directory, 'config.local.yaml.lock');
			await writeFile(lock, 'foreign');
			await expect(store.save(config)).rejects.toThrow('busy');
			expect(await readFile(lock, 'utf8')).toBe('foreign');
			await rm(lock);
			vi.mocked(rename).mockRejectedValueOnce(new Error('fixture-secret'));
			await expect(store.save(config)).rejects.toThrow('Unable to save configuration');
			expect(await readdir(directory)).toEqual([]);
			await store.save(config);
			expect(await readdir(directory)).toEqual(['config.local.yaml']);
			expect(parse(await readFile(join(directory, 'config.local.yaml'), 'utf8')).title).toBe('retry');
		});
	});
	it('treats only an empty YAML document as an empty layer and sanitizes parser failures', async () => {
		await fixture(async (_directory, base) => {
			const store = createFileConfigStore(base);
			await writeFile(base, '# an empty document\n');
			expect((await store.load()).services).toEqual({});
			for (const content of ['null\n', 'fixture-secret: [', 'version: 999\n']) {
				await writeFile(base, content);
				await expect(store.load()).rejects.toThrow('base configuration');
				try {
					await store.load();
				} catch (error) {
					expect(String(error)).not.toContain('fixture-secret');
				}
				expect(await readFile(base, 'utf8')).toBe(content);
			}
		});
	});
});
