import type { MaybePromise } from '@wener/utils';
import type { ExpiryValue } from '../../ExpiryValue';

export function getExpiryValueOrRequest(v: ExpiryValue | undefined, f: () => ExpiryValue): ExpiryValue;
export function getExpiryValueOrRequest(
	v: ExpiryValue | undefined,
	f: () => Promise<ExpiryValue>,
): Promise<ExpiryValue>;
export function getExpiryValueOrRequest(
	v: ExpiryValue | undefined,
	f: () => MaybePromise<ExpiryValue>,
): MaybePromise<ExpiryValue> {
	if (!v) {
		return f();
	}

	const isExpired = v.expiresAt.getTime() - Date.now() < 30 * 1000;

	if (isExpired) {
		return f();
	}

	return v;
}
