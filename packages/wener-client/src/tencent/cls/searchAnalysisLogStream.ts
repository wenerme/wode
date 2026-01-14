import type { MaybePromise } from '@wener/utils';
import type { TencentLogClient, SearchLogRequest, SearchLogResponse } from './TencentLogClient';
import type { Column } from './types';

export type SearchAnalysisLogStreamOptions = {
	client: TencentLogClient;
	onResponse?: (res: SearchLogResponse, ctx: { from: number; to: number; count: number }) => MaybePromise<void>;
	interval: number;
	To?: number;
	From?: number;
	/**
	 * 时间处理方向
	 * - 'forward': 从 From 到 To，时间递增 (适合历史数据分析、数据处理)
	 * - 'backward': 从 To 到 From，时间递减 (适合实时监控、故障排查)
	 * - 'auto': 自动推断方向
	 *   - 有 From 无 To: forward
	 *   - 有 To 无 From: backward
	 *   - 都有: forward (From -> To)
	 *   - 都没有: backward (从现在往前)
	 * 默认: 'auto'
	 */
	direction?: 'forward' | 'backward' | 'auto';
} & Omit<SearchLogRequest, 'From' | 'To'>;

export async function* searchAnalysisLogStream({
	client,
	onResponse,
	From,
	To,
	interval,
	direction = 'auto',
	...options
}: SearchAnalysisLogStreamOptions): AsyncGenerator<{
	index: number;
	record: Record<string, any>;
	columns?: Column[] | null;
	range: { From: number; To: number };
	raw: SearchLogResponse;
}> {
	if (interval <= 0) {
		throw new Error('interval must be > 0');
	}

	if (options.UseNewAnalysis === false) {
		throw new Error('only support UseNewAnalysis');
	}

	// 自动推断方向
	let actualDirection = direction;
	if (direction === 'auto') {
		if (From && !To) {
			actualDirection = 'forward';
		} else if (To && !From) {
			actualDirection = 'backward';
		} else if (From && To) {
			actualDirection = 'forward';
		} else {
			// 都没有，默认从现在往前
			actualDirection = 'backward';
			To = Date.now();
		}
	}

	// 设置默认值
	if (!To) To = Date.now();
	if (!From) {
		if (actualDirection === 'forward') {
			From = To - interval;
		} else {
			// backward 模式下不设置 From，让其无限往前
		}
	}

	let index = 0;

	if (actualDirection === 'forward') {
		// Forward: From -> To
		let start = From!;
		while (start < To) {
			const end = Math.min(start + interval - 1, To);

			const res = await client.searchLog({
				...options,
				From: start,
				To: end,
				UseNewAnalysis: true,
			});
			await onResponse?.(res, { from: start, to: end, count: getRecordCount(res) });

			yield* processResponse(res, start, end, index);
			index += getRecordCount(res);

			start = end + 1;
		}
	} else {
		// Backward: To -> From (可能无限往前)
		let end = To;
		while (!From || end > From) {
			const start = Math.max(end - interval + 1, From || 0);

			const res = await client.searchLog({
				...(options as any),
				From: start,
				To: end,
				UseNewAnalysis: true,
			});
			await onResponse?.(res, { from: start, to: end, count: getRecordCount(res) });

			yield* processResponse(res, start, end, index);
			index += getRecordCount(res);

			end = start - 1;

			// 如果没有设置 From，检查是否还有更早的数据
			if (!From && !res.Results?.length && !res.AnalysisRecords?.length && !res.AnalysisResults?.length) {
				// 没有数据了，停止
				break;
			}
		}
	}
}

function* processResponse(
	res: SearchLogResponse,
	start: number,
	end: number,
	startIndex: number,
): Generator<{
	index: number;
	record: Record<string, any>;
	columns?: Column[] | null;
	range: { From: number; To: number };
	raw: SearchLogResponse;
}> {
	if (!res.Analysis) {
		throw new Error('Expected analysis response (Query must contain SQL)');
	}

	let index = startIndex;

	// New analysis format (default and recommended)
	if (res.AnalysisRecords && res.Columns) {
		for (const rec of res.AnalysisRecords) {
			let parsed: any;
			try {
				parsed = JSON.parse(rec);
			} catch {
				parsed = { value: rec };
			}
			yield {
				index: index++,
				record: parsed,
				columns: res.Columns,
				range: { From: start, To: end },
				raw: res,
			};
		}
	} else if (res.AnalysisResults && res.ColNames) {
		// Old analysis format (for backward compatibility)
		for (const row of res.AnalysisResults) {
			const obj: Record<string, any> = {};
			for (const item of row.Data) {
				obj[item.Key] = item.Value;
			}
			yield {
				index: index++,
				record: obj,
				columns: null,
				range: { From: start, To: end },
				raw: res,
			};
		}
	}
}

function getRecordCount(res: SearchLogResponse): number {
	if (res.AnalysisRecords) {
		return res.AnalysisRecords.length;
	}
	if (res.AnalysisResults) {
		return res.AnalysisResults.length;
	}
	return 0;
}
