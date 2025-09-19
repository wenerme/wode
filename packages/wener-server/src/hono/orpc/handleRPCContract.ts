import { experimental_SmartCoercionPlugin as SmartCoercionPlugin } from '@orpc/json-schema';
import { OpenAPIGenerator } from '@orpc/openapi';
import { OpenAPIHandler } from '@orpc/openapi/fetch';
import { onError, type Router } from '@orpc/server';
import { RPCHandler } from '@orpc/server/fetch';
import { CORSPlugin } from '@orpc/server/plugins';
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4';
import { html } from 'hono/html';
import type { AnyHono } from '../types';

export function handleRPCContract(app: AnyHono, router: Router<any, any>) {
	// const prefix = '/api/rpc';
	{
		const handleByRpc = new RPCHandler(router);
		const handleByOpenAPI = new OpenAPIHandler(router, {
			plugins: [
				new SmartCoercionPlugin({
					schemaConverters: [new ZodToJsonSchemaConverter()],
				}),
				new CORSPlugin({
					exposeHeaders: ['Content-Disposition'],
				}),
			],
			interceptors: [onError((error) => console.error(error))],
		});

		app.use('/api/rpc/*', async (c, next) => {
			{
				const { matched, response } = await handleByRpc.handle(c.req.raw, {
					prefix: '/api/rpc',
					context: {},
				});

				if (matched) {
					return c.newResponse(response.body, response);
				}
			}

			return await next();
		});

		app.use('/api/*', async (c, next) => {
			{
				const { matched, response } = await handleByOpenAPI.handle(c.req.raw, {
					prefix: '/api',
					context: {},
				});
				if (matched) {
					return c.newResponse(response.body, response);
				}
			}
			return await next();
		});
	}

	{
		const openAPIGenerator = new OpenAPIGenerator({
			schemaConverters: [new ZodToJsonSchemaConverter()],
		});
		let spec: { current?: any } = {};

		async function loadSpec() {
			return (spec.current = await openAPIGenerator.generate(router, {
				servers: [
					{
						url: '/api',
					},
				],
				security: [{ bearerAuth: [] }],
				components: {
					securitySchemes: {
						bearerAuth: {
							type: 'http',
							scheme: 'bearer',
						},
					},
				},
			}));
		}

		let specUrl = '/api/contract/spec.json';
		app.get(specUrl, async (c) => {
			return c.json(await loadSpec());
		});
		app.get('/api/contract/docs.html', async (c) => {
			return c.html(
				html`<!doctype html>
					<html lang="en">
						<head>
							<title>Docs</title>
							<meta charset="utf-8" />
							<meta name="viewport" content="width=device-width, initial-scale=1" />
						</head>
						<body>
							<script
								id="api-reference"
								data-url="${specUrl}"
								data-configuration="${JSON.stringify({
									authentication: {
										preferredSecurityScheme: 'bearerAuth',
										http: {
											bearer: { token: 'default-token' },
										},
									},
								}).replaceAll('"', '&quot;')}"
							></script>
							<script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
						</body>
					</html>`,
			);
		});
	}
}
