import { createORPCClient, type ClientContext } from '@orpc/client';
import type { LinkFetchClientOptions } from '@orpc/client/fetch';
import type { BatchLinkPluginOptions, DedupeRequestsPluginOptions } from '@orpc/client/plugins';
import type { StandardLinkPlugin } from '@orpc/client/standard';
import type { AnyContractRouter, ContractRouterClient } from '@orpc/contract';
import type { JsonifiedClient } from '@orpc/openapi-client';
import { OpenAPILink } from '@orpc/openapi-client/fetch';
import type { PartialRequired } from '@wener/utils';
import { buildBaseUrl } from '../utils/buildBaseUrl';
import { resolveLinkPlugins } from './resolveLinkPlugins';

export function createOpenApiContractClient<TContract extends AnyContractRouter>(
	contract: TContract,
	options: PartialRequired<CreateContractClientOptions, 'url'>,
): JsonifiedClient<ContractRouterClient<TContract, ClientContext>> {
	let { url, baseUrl, apiKey, getApiKey, getHeaders } = options;
	const baseHeaders = new Headers(options.headers);
	if (apiKey) {
		baseHeaders.set('Authorization', `Bearer ${apiKey}`);
	}
	url = buildBaseUrl(url, baseUrl);
	return createORPCClient(
		new OpenAPILink(contract, {
			url,
			headers: () => {
				let headers = new Headers(baseHeaders);

				let accessToken = getApiKey?.();
				if (accessToken) {
					headers.set('Authorization', `Bearer ${accessToken}`);
				}
				headers = getHeaders?.(headers) ?? headers;
				return headers;
			},
			plugins: resolveLinkPlugins(options),
			fetch: options.fetch,
		}),
	) as JsonifiedClient<ContractRouterClient<TContract, ClientContext>>;
}

export type CreateContractClientOptions = {
	url?: string;
	baseUrl?: string;
	apiKey?: string;
	headers?: Record<string, string> | Headers;
	getApiKey?: () => string | void;
	getHeaders?: (headers: Headers) => Headers | void;
	plugins?: StandardLinkPlugin<any>[];
	fetch?: LinkFetchClientOptions<any>['fetch'];
	batch?: BatchLinkPluginOptions<any> | boolean;
	dedup?: DedupeRequestsPluginOptions<any> | boolean;
};
