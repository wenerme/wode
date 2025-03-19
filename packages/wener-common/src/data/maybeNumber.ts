export type MaybeNumber = number | null | string | undefined | bigint;

export function maybeNumber(v: MaybeNumber) {
	if (v === null || v === undefined) {
		return undefined;
	}

	switch (typeof v) {
		case 'number':
			return v;
		case 'bigint':
			return Number(v);
		case 'string':
			if (v === '') {
				return undefined;
			}
	}
	const n = Number(v);
	if (isNaN(n)) {
		return undefined;
	}
	return n;
}
