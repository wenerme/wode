import { BatchLinkPlugin, DedupeRequestsPlugin } from '@orpc/client/plugins';
import { resolveFeatureOptions } from '../utils/resolveFeatureOptions';
import type { CreateRpcContractClientOptions } from './createRpcContractClient';

export function resolveLinkPlugins({ plugins = [], dedup, batch }: CreateRpcContractClientOptions) {
	batch = resolveFeatureOptions(batch, {
		groups: [
			{
				condition: () => true,
				context: {},
			},
		],
	});
	if (batch) {
		plugins.push(new BatchLinkPlugin(batch));
	}
	dedup = resolveFeatureOptions(dedup, {
		groups: [
			{
				condition: () => true,
				context: {},
			},
		],
	});
	if (dedup) {
		plugins.push(new DedupeRequestsPlugin(dedup));
	}
	return plugins;
}
