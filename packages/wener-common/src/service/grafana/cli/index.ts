import { isGrafanaWriteMethod } from '@wener/client/grafana';
import { type ServiceCliDefinition, serviceCliString, serviceCliStrings } from '../../cli/ServiceCliDefinition';
import { ServiceCliInputError } from '../../cli/ServiceCliInputError';
import type { IGrafanaService } from '../index';
import { sanitizeGrafanaOutput } from '../sanitize';

/** 与 Grafana Service 的缺省规则一致；这里只决定 CLI 的确认和文件读取顺序。 */
function grafanaApiMethod(options: { method?: string; body?: string }): string {
	const method = (options.method ?? (options.body === undefined ? 'GET' : 'POST')).trim().toUpperCase();
	if (!['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
		throw new ServiceCliInputError('--method must be GET, HEAD, OPTIONS, POST, PUT, PATCH or DELETE');
	}
	if (['GET', 'HEAD'].includes(method) && options.body !== undefined) {
		throw new ServiceCliInputError('--body cannot be used with GET or HEAD');
	}
	return method;
}

export const GrafanaCliDefinition: ServiceCliDefinition<IGrafanaService> = {
	name: 'grafana',
	aliases: ['gf'],
	description: 'Check Grafana health and call the authenticated Grafana HTTP API',
	options: [],
	commands: [
		{
			name: 'status', description: 'Check Grafana health',
			prepare: () => async (service, callOptions) => sanitizeGrafanaOutput(await service.health(callOptions)),
		},
		{
			name: 'whoami', description: 'Read the current authenticated Grafana user',
			prepare: () => async (service, callOptions) => sanitizeGrafanaOutput(await service.whoAmI(callOptions)),
		},
		{
			name: 'api', argument: 'path', description: 'Call a Grafana API path; non-read methods require --yes and a writable service',
			options: [
				{ name: 'method', aliases: ['X'], description: 'HTTP method; GET by default, POST with --body' },
				{ name: 'query', description: 'Query parameter key=value; repeatable', repeatable: true },
				{ name: 'body', description: 'JSON body, @file or - for stdin' },
				{ name: 'yes', description: 'Confirm a write request', type: 'boolean' },
			],
			async prepare(context) {
				const path = context.args[0];
				if (!path) throw new ServiceCliInputError('Grafana API path is required');
				const bodyArgument = serviceCliString(context.options, 'body');
				const method = grafanaApiMethod({ method: serviceCliString(context.options, 'method'), body: bodyArgument });
				if (isGrafanaWriteMethod(method) && context.options.yes !== true)
					throw new ServiceCliInputError('Grafana API write requires --yes');
				const params: Record<string, string | string[]> = Object.create(null);
				for (const value of serviceCliStrings(context.options, 'query') ?? []) {
					const at = value.indexOf('=');
					if (at < 1) throw new ServiceCliInputError('--query expects key=value');
					const key = value.slice(0, at);
					const entry = value.slice(at + 1);
					const previous = params[key];
					params[key] = previous === undefined ? entry : [...(Array.isArray(previous) ? previous : [previous]), entry];
				}
				let body: unknown;
				if (bodyArgument !== undefined) {
					const text = await context.readText(bodyArgument, { label: 'Grafana API body', maxBytes: 1024 * 1024 });
					try {
						body = JSON.parse(text);
					} catch {
						throw new ServiceCliInputError('--body must contain valid JSON');
					}
				}
				const input = { path, method, params, ...(body === undefined ? {} : { body }) };
				return async (service, callOptions) => sanitizeGrafanaOutput(await service.request(input, callOptions));
			},
		},
	],
};
