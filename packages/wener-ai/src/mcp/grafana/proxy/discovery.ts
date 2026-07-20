import type { GrafanaApiClient } from '../client';

export const McpCapableDatasourceTypes = Object.freeze({
	tempo: '/api/mcp',
} as const);

export type DiscoveredProxyDatasource = {
	uid: string;
	name: string;
	type: string;
	endpoint: string;
};

export async function discoverProxiedDatasources(client: GrafanaApiClient) {
	const datasources = await client.listDatasources();
	const discovered: DiscoveredProxyDatasource[] = [];

	for (const datasource of datasources) {
		const uid = datasource.uid;
		const type = datasource.type;
		if (!uid || !type) continue;

		const endpointPath = McpCapableDatasourceTypes[type as keyof typeof McpCapableDatasourceTypes];
		if (!endpointPath) continue;

		const endpoint = `${client.baseUrl}${client.datasourceProxyPath(uid, endpointPath)}`;

		try {
			const { response } = await client.fetch({
				path: client.datasourceProxyPath(uid, endpointPath),
				method: 'DELETE',
				expectedStatuses: [200, 204, 404, 405],
				responseType: 'text',
			});
			if (response.status === 200 || response.status === 204 || response.status === 405) {
				discovered.push({
					uid,
					name: datasource.name || uid,
					type,
					endpoint,
				});
			}
		} catch {
			// Ignore probe failures; proxied datasources are optional.
		}
	}

	return discovered;
}
