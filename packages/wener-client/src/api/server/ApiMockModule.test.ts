import { OpenAPIHono } from '@hono/zod-openapi';
import { describe, expect, test, vi } from 'vitest';
import { ApiMockModule } from './ApiMockModule';

describe('ApiMockModule', () => {
	test('把配置传给宿主路由工厂，挂载一次并清理内部任务存储', () => {
		const taskStore = { clear: vi.fn() };
		const routes = { fetch: vi.fn() };
		const config = { response: 'module response' };
		const handlers = { custom: () => 'custom result' };
		const log = { info: vi.fn() };
		const route = vi.fn();
		const createRoutes = vi.fn(() => routes);
		const module = new ApiMockModule({ config, handlers, createRoutes, createTaskStore: () => taskStore });
		const context = { get: () => ({ route }), log };
		module.onApplicationBootstrap(context);
		expect(createRoutes).toHaveBeenCalledWith({ config, handlers, log, taskStore });
		expect(route).toHaveBeenCalledWith('/mock', routes);
		expect(() => module.onApplicationBootstrap(context)).toThrow('只能挂载一次');
		module.onModuleDestroy();
		expect(taskStore.clear).toHaveBeenCalledOnce();
	});

	test('路由工厂可接入实际 Hono 宿主并处理本地 HTTP 请求', async () => {
		const app = new OpenAPIHono();
		const module = new ApiMockModule({
			config: { text: 'module response' },
			createRoutes: ({ config }) => {
				const routes = new OpenAPIHono();
				routes.post('/v1/chat/completions', (context) =>
					context.json({ choices: [{ message: { content: config?.text } }] }),
				);
				return routes;
			},
		});
		module.onApplicationBootstrap({ get: () => app, log: console });
		const response = await app.request('/mock/v1/chat/completions', { method: 'POST' });
		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({ choices: [{ message: { content: 'module response' } }] });
	});

	test('宿主拥有的存储不由模块清理，并支持自定义路径和 logger', () => {
		const taskStore = { clear: vi.fn() };
		const route = vi.fn();
		const log = { info: vi.fn() };
		const createRoutes = vi.fn(() => 'routes');
		const module = new ApiMockModule({ path: '/fixture', log, taskStore, createRoutes });
		module.onApplicationBootstrap({ get: () => ({ route }), log });
		expect(route).toHaveBeenCalledWith('/fixture', 'routes');
		module.onModuleDestroy();
		expect(taskStore.clear).not.toHaveBeenCalled();
	});
});
