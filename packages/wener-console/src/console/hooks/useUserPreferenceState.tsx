import type { Dispatch, SetStateAction } from 'react';
import type { ZodType } from 'zod';
import { useLocalStorageState } from '../../hooks/useLocalStorageState';

export function useUserPreferenceState<T extends {}>({
	key,
	schema,
}: {
	key: string;
	schema?: ZodType<T>;
}): [T, Dispatch<SetStateAction<T>>] {
	const [value, set] = useLocalStorageState<T>(`UserPerf.${key}`, {
		defaultValue: (() => {
			try {
				return schema?.parse({}) || {};
			} catch (_e) {}
			return {};
		}) as () => T,
	});

	return [value, set];
}
