import { maybeFunction, type MaybeFunction } from '@wener/utils';
import { clamp, mapValues, omitBy, pick } from 'es-toolkit';
import { maybeNumber, type MaybeNumber } from './maybeNumber';

export type PaginationInput = {
	limit?: MaybeNumber;
	offset?: MaybeNumber;
	pageSize?: MaybeNumber;
	pageNumber?: MaybeNumber;
	pageIndex?: MaybeNumber;
};

export type ResolvedPagination = {
	limit: number;
	offset: number;
	pageSize: number;
	pageNumber: number;
	pageIndex: number;
};

export function resolvePagination(
	page: PaginationInput,
	options: {
		pageSize?: MaybeFunction<number, [number | undefined]>;
		maxPageSize?: number;
	} = {},
): ResolvedPagination {
	let out = omitBy(
		mapValues(
			//
			pick(page, ['limit', 'offset', 'pageSize', 'pageNumber', 'pageIndex']),
			// to Number
			(v) => maybeNumber(v),
		),
		(v) => v === undefined || v === null,
	);
	let { pageSize } = out;
	if (options.pageSize) {
		pageSize = maybeFunction(options.pageSize, pageSize);
	}
	pageSize ??= 20;
	pageSize = clamp(pageSize, 1, options.maxPageSize ?? 100);

	let { pageNumber = 1, pageIndex, limit, offset } = out;
	// page index over page number
	pageNumber = Math.max(pageNumber, 1);
	pageIndex = Math.max(pageIndex ?? pageNumber - 1, 0);
	limit = Math.max(1, limit ?? pageSize);
	offset = Math.max(0, offset ?? pageSize * pageIndex);

	pageSize = limit;
	pageIndex = Math.floor(offset / pageSize);
	return {
		limit,
		offset,
		pageSize,
		pageNumber: pageIndex + 1,
		pageIndex,
	};
}
