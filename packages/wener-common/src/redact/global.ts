import { getGlobalStates, setGlobalStates } from '@wener/utils';
import { createRedactor } from './createRedactor';
import type { Redactor } from './types';

const GlobalKey = '@wener/common/utils/redact';

export function getRedactor(): Redactor {
	return getGlobalStates(GlobalKey, () => createRedactor());
}

/** Replaces the current singleton and returns the previous one; no argument resets to defaults. */
export function setRedactor(redactor: Redactor = createRedactor()): Redactor {
	const previous = getRedactor();
	setGlobalStates(GlobalKey, redactor);
	return previous;
}

export function redact<T>(value: T): T {
	return getRedactor().redact(value);
}

export function isSensitive(value: unknown, key?: string): boolean {
	return getRedactor().isSensitive(value, key);
}
