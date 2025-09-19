import type { MaybePromise } from '@wener/utils';
import { TencentLogClient, type SearchLogRequest, type SearchLogResponse } from './TencentLogClient';
import type { LogInfo } from './types';

export type SearchLogStreamOptions = {
	client: TencentLogClient;
	onResponse?: (res: SearchLogResponse, ctx: { from: number; to: number; count: number }) => MaybePromise<void>;
} & SearchLogRequest;

export async function* searchLogStream({
	client,
	onResponse,
	...options
}: SearchLogStreamOptions): AsyncGenerator<{ info: LogInfo; log: Record<string, any>; index: number }> {
	let context: string | undefined = undefined;
	let n = 0;
	while (true) {
		const result = await client.searchLog({
			...options,
			Context: context,
		});
		await onResponse?.(result, {
			from: options.From || 0,
			to: options.To || Date.now(),
			count: result.Results?.length || 0,
		});
		if (result.Analysis) {
			throw new Error('Analysis not supported');
		}
		context = result.Context;

		if (result.Results) {
			for (const info of result.Results) {
				yield {
					info,
					index: n++,
					get log() {
						if (!info.LogJson) return undefined;
						return JSON.parse(info.LogJson);
					},
				};
			}
		}

		if (result.ListOver) {
			break;
		}
	}
}
