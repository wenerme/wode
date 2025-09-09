import type { MaybePromise } from '@wener/utils';
import { TencentLogClient, type SearchLogRequest, type SearchLogResponse } from './TencentLogClient';
import type { LogInfo } from './types';

export async function* searchLogStream({
	client,
	onResponse,
	...options
}: {
	client: TencentLogClient;
	onResponse?: (res: SearchLogResponse) => MaybePromise<void>;
} & SearchLogRequest): AsyncGenerator<{ info: LogInfo; log: Record<string, any>; index: number }> {
	let context: string | undefined = undefined;
	let n = 0;
	while (true) {
		const result = await client.searchLog({
			...options,
			Context: context,
		});
		await onResponse?.(result);
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
