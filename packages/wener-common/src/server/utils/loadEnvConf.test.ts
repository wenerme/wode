import assert from 'node:assert/strict';

import { loadEnvConf } from './loadEnvConf';
import { test } from 'vite-plus/test';
import { z } from 'zod/v4';

test('loadEnvConf maps nested fields and prefers application-prefixed values', () => {
  const schema = z.object({
    db: z.object({
      poolSize: z.coerce.number().int().positive().default(5),
      url: z.string().min(1),
    }),
    enabled: z.stringbool().default(false),
    host: z.string().default('0.0.0.0'),
    port: z.coerce.number().int().min(1).max(65_535),
  });

  const config = loadEnvConf(schema, {
    env: {
      APP_NAME: 'api-server',
      API_SERVER_DB_POOL_SIZE: '12',
      API_SERVER_DB_URL: 'postgres://application',
      API_SERVER_HOST: '127.0.0.1',
      DB_URL: 'postgres://global',
      ENABLED: 'true',
      HOST: '0.0.0.0',
      PORT: '8022',
      UNUSED: 'ignored',
    },
  });

  assert.deepEqual(config, {
    db: { poolSize: 12, url: 'postgres://application' },
    enabled: true,
    host: '127.0.0.1',
    port: 8022,
  });
});

test('loadEnvConf supports an explicit stable environment name and global fallback', () => {
  const schema = z.object({
    postgresUrl: z.string().meta({ 'x-env-name': 'DATABASE_URL', 'x-sensitive': true }),
    request: z.object({ timeoutMs: z.coerce.number().int().positive().default(5_000) }),
  });

  assert.deepEqual(
    loadEnvConf(schema, {
      env: { DATABASE_URL: 'postgres://global', REQUEST_TIMEOUT_MS: '3000' },
      name: 'worker',
    }),
    { postgresUrl: 'postgres://global', request: { timeoutMs: 3000 } },
  );
});

test('loadEnvConf rejects duplicate environment mappings', () => {
  const schema = z.object({ fooBar: z.string(), foo_bar: z.string() });
  assert.throws(() => loadEnvConf(schema, { env: {} }), /Environment name FOO_BAR is shared/u);
});

test('loadEnvConf delegates value coercion and validation to the schema', () => {
  const schema = z.object({ port: z.coerce.number().int().min(1).max(65_535) });
  assert.throws(() => loadEnvConf(schema, { env: { PORT: 'not-a-port' } }), z.ZodError);
});

test('loadEnvConf requires an object schema and validates metadata names', () => {
  assert.throws(() => loadEnvConf(z.string(), { env: {} }), /requires a Zod object schema/u);
  assert.throws(
    () => loadEnvConf(z.object({ value: z.string().meta({ 'x-env-name': 'invalid-name' }) }), { env: {} }),
    /x-env-name must be an upper snake case/u,
  );
});
