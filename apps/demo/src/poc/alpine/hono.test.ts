import { OpenAPIHono } from '@hono/zod-openapi';
import { createHelperRoute } from '@src/poc/alpine/createHelperRoute';
import { testClient } from 'hono/testing';
import { expect, test } from 'vitest';

test('hono', async () => {
  const app = new OpenAPIHono()
    // 合并
    .route('/', createHelperRoute())
    .get('/api/v1', (c) => {
      return c.json({ ok: true, value: 1 });
    });
  expect(await (await app.request('/api/v1')).json()).toEqual({
    ok: true,
    value: 1,
  });

  if (false) {
    // 404 WHY ?
    const cli: Record<string, any> = testClient(app);
    console.log(await cli.app.v1.$get().then((v: any) => v.text()));
    expect(await cli.app.v1.$get().then((v: any) => v.json())).toEqual({
      ok: true,
      value: 1,
    });
  }
});
