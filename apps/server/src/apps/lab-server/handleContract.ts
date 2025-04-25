import type { HttpBindings } from '@hono/node-server';
import { oc, type AnySchema } from '@orpc/contract';
import {
	OpenAPIGenerator,
	type ConditionalSchemaConverter,
	type JSONSchema,
	type SchemaConvertOptions,
} from '@orpc/openapi';
import { OpenAPIHandler } from '@orpc/openapi/fetch';
import { implement, onError } from '@orpc/server';
import { RPCHandler } from '@orpc/server/fetch';
import { CORSPlugin } from '@orpc/server/plugins';
import { toJsonSchema } from '@wener/common/schema';
import type { Hono } from 'hono';
import { html } from 'hono/html';
import { z } from 'zod';

const ServerContract = {
	version: oc.output(
		z.object({
			version: z.string(),
		}),
	),
};

const os = implement(ServerContract);

const router = os.router({
	version: os.version.handler(() => {
		return {
			version: '1.0.0',
		};
	}),
});

export function handleContract(app: Hono<{ Bindings: HttpBindings }>) {
	{
		const handleByRpc = new RPCHandler(router);
		const handleByOpenAPI = new OpenAPIHandler(router, {
			plugins: [new CORSPlugin()],
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
			schemaConverters: [new _ZodToJsonSchemaConverter()],
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

		const specUrl = '/api/spec.json';
		app.get(specUrl, async (c) => {
			return c.json(await loadSpec());
		});
		app.get('/api/docs.html', async (c) => {
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

class _ZodToJsonSchemaConverter implements ConditionalSchemaConverter {
	condition(schema: AnySchema | undefined): boolean {
		return schema !== undefined && schema['~standard'].vendor === 'zod';
	}

	convert(
		schema: AnySchema | undefined,
		options: SchemaConvertOptions,
		lazyDepth = 0,
		isHandledCustomJSONSchema = false,
		isHandledZodDescription = false,
	): [required: boolean, jsonSchema: Exclude<JSONSchema, boolean>] {
		const def = (schema as z.ZodSchema).def;

		if (!isHandledZodDescription && 'description' in def && typeof def.description === 'string') {
			const [required, json] = this.convert(schema, options, lazyDepth, isHandledCustomJSONSchema, true);

			return [required, { ...json, description: def.description }];
		}

		return [true, toJsonSchema(schema) as Exclude<JSONSchema, boolean>];
	}
}
