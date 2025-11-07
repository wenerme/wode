import { maybeFunction, type MaybeFunction } from '@wener/utils';

export function resolveFeatureOptions<T>(
	value: boolean | T | undefined | null,
	defaultValue: MaybeFunction<T>,
): T | undefined {
	if (value === false) {
		return undefined;
	}
	if (value === true || value === undefined || value === null) {
		return maybeFunction(defaultValue);
	}
	return value;
}
