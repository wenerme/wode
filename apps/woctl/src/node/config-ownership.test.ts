import { lstat, mkdtemp, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { expect, it, vi } from 'vitest';
import { parse } from 'yaml';
import { createFileConfigStore } from './config';

const directoryRace = vi.hoisted((): { afterRead?: () => Promise<void> } => ({}));

vi.mock('node:fs/promises', async (importOriginal) => {
	const actual = await importOriginal<typeof import('node:fs/promises')>();
	return {
		...actual,
		rename: vi.fn(actual.rename),
		async readdir(...args: Parameters<typeof actual.readdir>) {
			const entries = await actual.readdir(...args);
			const afterRead = directoryRace.afterRead;
			directoryRace.afterRead = undefined;
			await afterRead?.();
			return entries;
		},
	};
});

it('rejects creating local when another writer creates its overlay after directory enumeration', async () => {
	const actual = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises');
	const directory = await actual.mkdtemp(join(tmpdir(), 'wocli-context-appeared-'));
	const base = join(directory, 'config.yaml');
	const overlay = join(directory, 'config.local.yaml');
	const baseBytes = Buffer.from('currentContext: local\nservices: []\n');
	const overlayBytes = Buffer.from('title: from-another-writer\nservices: []\n');
	let injected = false;
	try {
		await actual.writeFile(base, baseBytes);
		directoryRace.afterRead = async () => {
			await actual.writeFile(overlay, overlayBytes, { flag: 'wx' });
			injected = true;
		};
		await expect(createFileConfigStore(base).createContext('local')).rejects.toThrow('already exists');
		expect(injected).toBe(true);
		expect(await actual.readFile(base)).toEqual(baseBytes);
		expect(await actual.readFile(overlay)).toEqual(overlayBytes);
		expect((await actual.readdir(directory)).sort()).toEqual([basename(base), basename(overlay)].sort());
	} finally {
		directoryRace.afterRead = undefined;
		await actual.rm(directory, { recursive: true, force: true });
	}
});

it('creates local when its enumerated overlay is removed before the selected layer is read', async () => {
	const actual = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises');
	const directory = await actual.mkdtemp(join(tmpdir(), 'wocli-context-disappeared-'));
	const base = join(directory, 'config.yaml');
	const overlay = join(directory, 'config.local.yaml');
	const baseBytes = Buffer.from('currentContext: local\nservices: []\n');
	let injected = false;
	try {
		await actual.writeFile(base, baseBytes);
		await actual.writeFile(overlay, 'title: removed-before-read\nservices: []\n');
		directoryRace.afterRead = async () => {
			await actual.unlink(overlay);
			injected = true;
		};
		await expect(createFileConfigStore(base).createContext('local')).resolves.toBeUndefined();
		expect(injected).toBe(true);
		expect(await actual.readFile(base)).toEqual(baseBytes);
		expect(parse(await actual.readFile(overlay, 'utf8'))).toEqual({ services: [], defaults: { services: {} } });
		expect((await actual.readdir(directory)).sort()).toEqual([basename(base), basename(overlay)].sort());
	} finally {
		directoryRace.afterRead = undefined;
		await actual.rm(directory, { recursive: true, force: true });
	}
});

it('preserves a foreign replacement of the temporary file after rename fails and allows retry', async () => {
	const actual = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises');
	const directory = await mkdtemp(join(tmpdir(), 'wocli-config-ownership-'));
	const base = join(directory, 'config.yaml');
	const overlay = join(directory, 'config.local.yaml');
	const backup = join(directory, 'owned-temporary.backup');
	const baseBytes = Buffer.from('currentContext: local\nservices: []\n');
	const overlayBytes = Buffer.from('title: before\nservices: []\n');
	const foreignBytes = Buffer.from('foreign file owned by the test fixture\n');
	let foreignPath = '';
	try {
		await writeFile(base, baseBytes);
		await writeFile(overlay, overlayBytes);
		const store = createFileConfigStore(base);
		const config = await store.load();
		config.contexts.local.title = 'after';
		vi.mocked(rename).mockImplementationOnce(async (source, destination) => {
			expect(destination).toBe(overlay);
			if (typeof source !== 'string') throw new Error('Expected a temporary file path');
			foreignPath = source;
			// Keep the original inode alive so the replacement must be a different file.
			await actual.rename(source, backup);
			await writeFile(source, foreignBytes, { flag: 'wx', mode: 0o600 });
			throw Object.assign(new Error('Controlled rename failure'), { code: 'EIO' });
		});
		await expect(store.save(config)).rejects.toThrow('Unable to save configuration');
		expect(foreignPath).not.toBe('');
		expect(await readFile(base)).toEqual(baseBytes);
		expect(await readFile(overlay)).toEqual(overlayBytes);
		expect(await readFile(foreignPath)).toEqual(foreignBytes);
		const foreign = await lstat(foreignPath);
		const displaced = await lstat(backup);
		expect([foreign.dev, foreign.ino]).not.toEqual([displaced.dev, displaced.ino]);
		await expect(lstat(`${overlay}.lock`)).rejects.toMatchObject({ code: 'ENOENT' });

		// The one-shot failure is consumed; retry the same edit snapshot using the real rename.
		await store.save(config);
		expect(parse(await readFile(overlay, 'utf8')).title).toBe('after');
		expect(await readFile(base)).toEqual(baseBytes);
		expect(await readFile(foreignPath)).toEqual(foreignBytes);
		expect(await lstat(foreignPath)).toMatchObject({ dev: foreign.dev, ino: foreign.ino });
		expect((await readdir(directory)).sort()).toEqual(
			[basename(base), basename(overlay), basename(backup), basename(foreignPath)].sort(),
		);
	} finally {
		vi.mocked(rename).mockReset().mockImplementation(actual.rename);
		await rm(directory, { recursive: true, force: true });
	}
});
