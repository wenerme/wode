import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { Logger } from '@wener/utils/logger';
import { silent } from '@wener/utils/logger';
import { loadDotEnv } from './loadDotEnv';
import { test } from 'vite-plus/test';


async function withTempDotEnvDirectory(testCase: (cwd: string) => Promise<void>): Promise<void> {
  const cwd = await mkdtemp(join(tmpdir(), 'example-dotenv-'));
  try {
    await testCase(cwd);
  } finally {
    await rm(cwd, { force: true, recursive: true });
  }
}

test('loadDotEnv applies explicit files from lowest to highest declared precedence', async () => {
  await withTempDotEnvDirectory(async (cwd) => {
    await writeFile(join(cwd, '.env.low'), 'SOURCE=low\n');
    await writeFile(join(cwd, '.env.high'), 'SOURCE=high\n');

    const loaded = await loadDotEnv({
      cwd,
      files: ['.env.high', '.env.low'],
      log: silent,
    });

    assert.deepEqual(loaded, { SOURCE: 'high' });
  });
});

test('loadDotEnv composes mode, environment, profiles, and application-specific files', async () => {
  await withTempDotEnvDirectory(async (cwd) => {
    const layers: ReadonlyArray<readonly [string, string]> = [
      ['.env', 'base'],
      ['.env.production', 'mode'],
      ['.env.dev', 'environment'],
      ['.env.first', 'first-profile'],
      ['.env.second', 'second-profile'],
      ['.env.api-server', 'application'],
      ['.env.api-server.production', 'application-mode'],
      ['.env.api-server.dev', 'application-environment'],
      ['.env.api-server.first', 'application-first-profile'],
      ['.env.api-server.second', 'application-second-profile'],
    ];
    for (const [file, value] of layers) {
      await writeFile(join(cwd, file), `SOURCE=${value}\n`);
    }

    const loaded = await loadDotEnv({
      cwd,
      env: 'dev',
      log: silent,
      mode: 'production',
      name: 'api-server',
      profiles: ['first', 'second'],
    });

    assert.deepEqual(loaded, { SOURCE: 'application-second-profile' });
  });
});

test('loadDotEnv preserves existing env values while filling missing values', async () => {
  await withTempDotEnvDirectory(async (cwd) => {
    await writeFile(join(cwd, '.env'), 'EXISTING=file\nLOADED=file\n');
    const envs: Record<string, string | undefined> = { EXISTING: 'process' };

    await loadDotEnv({
      autoConfig: true,
      cwd,
      envs,
      files: ['.env'],
      log: silent,
    });

    assert.deepEqual(envs, { EXISTING: 'process', LOADED: 'file' });
  });
});

test('loadDotEnv uses Node dotenv parsing semantics', async () => {
  await withTempDotEnvDirectory(async (cwd) => {
    await writeFile(join(cwd, '.env'), 'export EXPORTED=value\nINLINE=value # comment\nMULTILINE="first\nsecond"\n');

    const loaded = await loadDotEnv({ cwd, files: ['.env'], log: silent });

    assert.deepEqual(loaded, { EXPORTED: 'value', INLINE: 'value', MULTILINE: 'first\nsecond' });
  });
});

test('loadDotEnv rejects unsafe selectors before resolving paths', async () => {
  await assert.rejects(loadDotEnv({ log: silent, name: '../other-app' }), /Invalid dotenv name selector/u);
});

test('loadDotEnv fails closed on malformed files unless strict mode is disabled', async () => {
  await withTempDotEnvDirectory(async (cwd) => {
    await mkdir(join(cwd, '.env'));
    await assert.rejects(loadDotEnv({ cwd, files: ['.env'], log: silent }), /Failed to load env file/u);

    let warnings = 0;
    const logger = { ...silent, warn: () => warnings++ } satisfies Logger;
    assert.deepEqual(await loadDotEnv({ cwd, files: ['.env'], log: logger, strict: false }), {});
    assert.equal(warnings, 1);
  });
});
