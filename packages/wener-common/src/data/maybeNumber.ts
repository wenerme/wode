export type MaybeNumber = number | null | string | undefined | bigint;

export function maybeNumber(v: MaybeNumber) {
	if (v === null || v === undefined) {
		return undefined;
	}

	switch (typeof v) {
		case 'number':
			return v;
		case 'bigint':
			if (v > BigInt(Number.MAX_SAFE_INTEGER) || v < BigInt(Number.MIN_SAFE_INTEGER)) {
				throw new Error(`bigint out of range`);
			}
			return Number(v);
		case 'string':
			v = v.trim();
			if (!v) {
				return undefined;
			}
	}
	const n = Number(v);
	if (isNaN(n)) {
		return undefined;
	}
	return n;
}
