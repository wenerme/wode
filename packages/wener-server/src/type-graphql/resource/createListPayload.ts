import { type Constructor, computeIfAbsent } from '@wener/utils';
import { Field, Int, ObjectType } from 'type-graphql';
import { getObjectName } from '../getObjectName';
import { getTypeCache } from '../getTypeCache';
import type { PageResponse } from './types';

export function createListPayload<T extends object>(Type: Constructor<T>): Constructor<PageResponse<T>> {
	let name = getObjectName(Type);
	let key = `${name}ListPayload`;
	return computeIfAbsent(getTypeCache(), key, () => {
		@ObjectType(key)
		class ListPayload {
			@Field((_type) => Int)
			total!: number;
			@Field((_type) => [Type])
			data!: T[];
		}

		return ListPayload;
	});
}
