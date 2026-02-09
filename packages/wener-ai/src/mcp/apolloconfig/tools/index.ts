import { GetInputSchema, StatInputSchema } from '../schemas';
import type { ApolloConfigContext } from '../server';

export function registerTools(ctx: ApolloConfigContext) {
	const { server, client, log } = ctx;

	server.registerTool(
		'stat',
		{
			description: 'Get Apollo Config namespace metadata: appId, cluster, releaseKey, and list of configuration keys.',
			inputSchema: StatInputSchema,
			annotations: { readOnlyHint: true },
		},
		async ({ namespace, cluster }) => {
			const opts = {
				...(namespace ? { namespace } : {}),
				...(cluster ? { cluster } : {}),
			};
			log.info(`stat: ${namespace ?? client.options.namespace} @ ${cluster ?? client.options.cluster}`);

			const config = await client.getConfig(opts);
			if (!config) {
				return { content: [{ type: 'text' as const, text: 'No configuration found (304 Not Modified)' }] };
			}

			const keys = Object.keys(config.configurations);
			const result = {
				appId: config.appId,
				cluster: config.cluster,
				namespace: config.namespaceName,
				releaseKey: config.releaseKey,
				keyCount: keys.length,
				keys,
			};
			return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
		},
	);

	server.registerTool(
		'get',
		{
			description: `Get Apollo Config configuration data for a namespace. Supports multiple formats:
- properties (default): key-value pairs
- json: parsed JSON (for namespaces like "app.json")
- yaml: parsed YAML (for namespaces like "app.yaml")
- raw: raw content string`,
			inputSchema: GetInputSchema,
			annotations: { readOnlyHint: true },
		},
		async ({ namespace, cluster, format }) => {
			const opts = {
				...(namespace ? { namespace } : {}),
				...(cluster ? { cluster } : {}),
			};

			const resolvedNs = namespace ?? client.options.namespace;
			log.info(`get: ${resolvedNs} @ ${cluster ?? client.options.cluster} format=${format ?? 'auto'}`);

			try {
				if (format === 'raw') {
					const content = await client.getContent({ ...opts, format: undefined });
					return { content: [{ type: 'text' as const, text: content }] };
				}

				const data = await client.getData({
					...opts,
					...(format ? { format: format as any } : {}),
				});

				const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
				return { content: [{ type: 'text' as const, text }] };
			} catch (e: any) {
				return { content: [{ type: 'text' as const, text: `Error: ${e.message}` }], isError: true };
			}
		},
	);
}
