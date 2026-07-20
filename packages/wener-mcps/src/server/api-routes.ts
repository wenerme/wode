import { SmartCoercionPlugin } from '@orpc/json-schema';
import { OpenAPIGenerator } from '@orpc/openapi';
import { OpenAPIHandler } from '@orpc/openapi/fetch';
import { RPCHandler } from '@orpc/server/fetch';
import { CORSPlugin } from '@orpc/server/plugins';
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4';
import type { Hono } from 'hono';
import { html } from 'hono/html';
import { createMcpsRouter } from './mcps-router';
import type { McpsConfig } from './schema';
import type { StatsProvider } from './server';

export interface RegisterApiRoutesOptions {
	app: Hono;
	config: McpsConfig;
	/** Additional oRPC routers registered by plugins (e.g. audit) */
	apiRouters?: Record<string, any>;
	/** Optional stats provider from audit plugin */
	statsProvider?: StatsProvider;
}

/**
 * Register oRPC API routes for MCPS.
 * Audit router is not included by default - use setupAudit() plugin to add it.
 */
export function registerApiRoutes({ app, config, apiRouters, statsProvider }: RegisterApiRoutesOptions) {
	const McpsRouter = createMcpsRouter({ config, statsProvider });

	const combinedRouter: Record<string, any> = {
		mcps: McpsRouter,
		...apiRouters,
	};

	const handleByRpc = new RPCHandler(combinedRouter);
	const handleByOpenAPI = new OpenAPIHandler(combinedRouter, {
		plugins: [
			new SmartCoercionPlugin({
				schemaConverters: [new ZodToJsonSchemaConverter()],
			}),
			new CORSPlugin({
				exposeHeaders: ['Content-Disposition'],
			}),
		],
	});

	app.use('/api/rpc/*', async (c, next) => {
		const { matched, response } = await handleByRpc.handle(c.req.raw, {
			prefix: '/api/rpc',
			context: {},
		});
		if (matched) {
			return c.newResponse(response.body, response);
		}
		return next();
	});

	app.use('/api/*', async (c, next) => {
		const { matched, response } = await handleByOpenAPI.handle(c.req.raw, {
			prefix: '/api',
			context: {},
		});
		if (matched) {
			return c.newResponse(response.body, response);
		}
		return next();
	});

	// OpenAPI spec
	const openAPIGenerator = new OpenAPIGenerator({
		schemaConverters: [new ZodToJsonSchemaConverter()],
	});
	let specCache: unknown;

	app.get('/api/spec.json', async (c) => {
		if (!specCache) {
			specCache = await openAPIGenerator.generate(combinedRouter, {
				info: { title: 'MCPS API', version: '1.0.0' },
				servers: [{ url: '/api' }],
			});
		}
		return c.json(specCache);
	});

	// Swagger UI
	app.get('/api/docs', (c) => {
		return c.html(
			html`<!doctype html>
				<html lang="en">
					<head>
						<title>MCPS API</title>
						<meta charset="utf-8" />
						<meta name="viewport" content="width=device-width, initial-scale=1" />
					</head>
					<body>
						<script id="api-reference" data-url="/api/spec.json"></script>
						<script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
					</body>
				</html>`,
		);
	});
}
