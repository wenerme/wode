import type { HttpBindings } from '@hono/node-server';
import { OpenAPIGenerator } from '@orpc/openapi';
import { OpenAPIHandler } from '@orpc/openapi/fetch';
import { onError, type Router } from '@orpc/server';
import { RPCHandler } from '@orpc/server/fetch';
import { CORSPlugin, ResponseHeadersPlugin } from '@orpc/server/plugins';
import {
	experimental_ZodSmartCoercionPlugin as ZodSmartCoercionPlugin,
	experimental_ZodToJsonSchemaConverter as ZodToJsonSchemaConverter,
} from '@orpc/zod/zod4';
import type { Hono } from 'hono';
import { html } from 'hono/html';
import { inspect } from 'util';

export function handleRPCContract(app: Hono<{ Bindings: HttpBindings }>, router: Router<any, any>) {
	{
		const handleByRpc = new RPCHandler(router, {
			plugins: [new ZodSmartCoercionPlugin(), new ResponseHeadersPlugin()],
		});
		const handleByOpenAPI = new OpenAPIHandler(router, {
			plugins: [
				new ZodSmartCoercionPlugin(),
				new CORSPlugin({
					exposeHeaders: ['Content-Disposition'],
				}),
				new ResponseHeadersPlugin(),
			],
			interceptors: [onError((error) => console.error(inspect(error, { depth: 5 })))],
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
					context: {
						env: c.env,
						raw: c,
					},
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
