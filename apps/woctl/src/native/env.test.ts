import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadNativeEnv } from './env';

const cleanup: string[] = [];
afterEach(async () => {
	for (const path of cleanup.splice(0)) await import('node:fs/promises').then(({ rm }) => rm(path, { recursive: true, force: true }));
});

describe('native dotenv lookup', () => {
	it('uses conventional project precedence without mutating process env', async () => {
		const root = await mkdtemp(join(tmpdir(), 'woctl-env-'));
		cleanup.push(root);
		await mkdir(join(root, '.git'));
		await mkdir(join(root, '.wode'));
		await writeFile(join(root, '.wode', '.env'), 'VALUE=wode\nWODE_ONLY=yes\nQUOTED="quoted value" # comment\n');
		await writeFile(join(root, '.env'), 'VALUE=env\nENV_ONLY=yes\n');
		await writeFile(join(root, '.wode', '.env.local'), 'VALUE=wode-local\n');
		await writeFile(join(root, '.env.local'), 'VALUE=local\nLOCAL_ONLY=yes\n');
		const before = process.env.WOCTL_TEST_ENV;
		const values = loadNativeEnv(root, { VALUE: 'process', PROCESS_ONLY: 'yes' });
		expect(values).toMatchObject({ VALUE: 'process', WODE_ONLY: 'yes', ENV_ONLY: 'yes', LOCAL_ONLY: 'yes', PROCESS_ONLY: 'yes', QUOTED: 'quoted value' });
		expect(process.env.WOCTL_TEST_ENV).toBe(before);
	});
});
