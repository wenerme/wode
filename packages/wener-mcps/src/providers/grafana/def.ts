import { type CreateGrafanaMcpServerOptions, GrafanaMcpServerDef } from '@wener/ai/mcp/grafana';
import type { GrafanaConfig } from '../../server/schema';
import { defineMcpServerHandler } from '../McpServerHandlerDef';

export const GrafanaHeaderNames = Object.freeze({
	__proto__: null,
	SERVICE_URL: 'X-GRAFANA-URL',
	SERVICE_ACCOUNT_TOKEN: 'X-GRAFANA-SERVICE-ACCOUNT-TOKEN',
	ORG_ID: 'X-GRAFANA-ORG-ID',
	USERNAME: 'X-GRAFANA-USERNAME',
	PASSWORD: 'X-GRAFANA-PASSWORD',
} as const);

function resolveOrgId(value: string | number | undefined): number | undefined {
	if (value === undefined || value === null || value === '') return undefined;
	const parsed = typeof value === 'number' ? value : Number.parseInt(value, 10);
	return Number.isFinite(parsed) ? parsed : undefined;
}

function resolveTimeoutMs(value: string | number | undefined): number | undefined {
	if (value === undefined || value === null || value === '') return undefined;
	const parsed = typeof value === 'number' ? value : Number.parseInt(value, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export const GrafanaMcpServerHandlerDef = defineMcpServerHandler<CreateGrafanaMcpServerOptions, GrafanaConfig>(
	GrafanaMcpServerDef,
	{
		headerMappings: [
			{ header: GrafanaHeaderNames.SERVICE_URL, property: 'url', required: true },
			{ header: GrafanaHeaderNames.SERVICE_ACCOUNT_TOKEN, property: 'serviceAccountToken' },
			{ header: GrafanaHeaderNames.ORG_ID, property: 'orgId' },
			{ header: GrafanaHeaderNames.USERNAME, property: 'username' },
			{ header: GrafanaHeaderNames.PASSWORD, property: 'password' },
		],

		resolveConfig(config, headers) {
			const url =
				config.url || headers?.get(GrafanaHeaderNames.SERVICE_URL) || config.headers?.[GrafanaHeaderNames.SERVICE_URL];
			if (!url) return null;

			const serviceAccountToken =
				config.serviceAccountToken ||
				headers?.get(GrafanaHeaderNames.SERVICE_ACCOUNT_TOKEN) ||
				config.headers?.[GrafanaHeaderNames.SERVICE_ACCOUNT_TOKEN];
			const username =
				config.username || headers?.get(GrafanaHeaderNames.USERNAME) || config.headers?.[GrafanaHeaderNames.USERNAME];
			const password =
				config.password || headers?.get(GrafanaHeaderNames.PASSWORD) || config.headers?.[GrafanaHeaderNames.PASSWORD];
			const orgId = resolveOrgId(
				config.orgId || headers?.get(GrafanaHeaderNames.ORG_ID) || config.headers?.[GrafanaHeaderNames.ORG_ID],
			);
			const timeoutMs = resolveTimeoutMs(config.timeoutMs);
			const reservedHeaders = new Set<string>([
				GrafanaHeaderNames.SERVICE_URL,
				GrafanaHeaderNames.SERVICE_ACCOUNT_TOKEN,
				GrafanaHeaderNames.ORG_ID,
				GrafanaHeaderNames.USERNAME,
				GrafanaHeaderNames.PASSWORD,
			]);
			const extraHeaders = Object.fromEntries(
				Object.entries(config.headers ?? {}).filter(([key]) => !reservedHeaders.has(key)),
			);

			return {
				url,
				serviceAccountToken: serviceAccountToken || undefined,
				orgId,
				username: username || undefined,
				password: password || undefined,
				timeoutMs,
				extraHeaders,
			};
		},
	},
);
