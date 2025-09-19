import { QueryOrder } from '@mikro-orm/core';
import type { QueryBuilder } from '@mikro-orm/postgresql';
import { parseSort, resolvePagination } from '@wener/common/data';
import { toKnexOrder } from './toKnexOrder';
import type { ListEntityRequest } from './types';

export function applyListQuery<T extends QueryBuilder<any>>({
	builder,
	query,
}: {
	builder: T;
	query: ListEntityRequest;
}) {
	{
		const { limit, offset } = resolvePagination(query);
		builder.limit(limit || 20).offset(offset);
	}

	const order = parseSort(query.order);
	if (order.length > 0) {
		builder.orderBy(toKnexOrder(order));
	} else {
		builder.orderBy({ id: QueryOrder.DESC });
	}

	if (!query.deleted) {
		builder = builder.andWhere({ deletedAt: null });
	}

	return builder;
}
