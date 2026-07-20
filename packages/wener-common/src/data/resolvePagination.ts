import { type MaybeFunction, maybeFunction } from '@wener/utils';
import { mapValues, omitBy, pick } from 'es-toolkit';
import { type MaybeNumber, maybeNumber } from './maybeNumber';

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
		maxLimit?: number;
		maxOffset?: number;
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
	pageSize ??= resolvePagination.pageSize;

	let { pageNumber = 1, pageIndex } = out;
	// page index over page number
	pageNumber = Math.max(pageNumber, 1);
	pageIndex = Math.max(pageIndex ?? pageNumber - 1, 0);

	let { limit = pageSize, offset = pageSize * pageIndex } = out;
	limit = Math.max(1, limit);
	offset = Math.max(0, offset);

	if (options.maxLimit) {
		limit = Math.min(limit, options.maxLimit);
	}
	if (options.maxOffset) {
		offset = Math.min(offset, options.maxOffset);
	}

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

resolvePagination.pageSize = 20;
