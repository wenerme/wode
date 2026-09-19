import { OpenAPIHono } from '@hono/zod-openapi';
import { expect, test } from 'vite-plus/test';
import { createHelperRoute } from './createHelperRoute';

test('hono', async () => {
	const app = new OpenAPIHono()
		// 合并
		.route('/', createHelperRoute())
		.get('/api/v1', (c) => {
			return c.json({ ok: true, value: 1 });
		});
	expect(await (await app.request('/api/v1')).json()).toEqual({ ok: true, value: 1 });
});
