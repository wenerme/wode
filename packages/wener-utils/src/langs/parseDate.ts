export type MaybeDate = Date | string | number | null | undefined;

export interface ParseDateOptions {
	/** Auto-convert unix timestamp in seconds to milliseconds (default: true) */
	unix?: boolean;
	/** Throw error if value is provided but cannot be parsed (default: false) */
	strict?: boolean;
}

export function parseDate(value: MaybeDate, opts?: ParseDateOptions): Date | undefined {
	const { unix = true, strict = false } = opts ?? {};
	let out: Date | undefined;
	if (value == null || value === '' || value === 0) {
		return undefined;
	}
	if (value instanceof Date) {
		out = value;
	} else if (typeof value === 'number') {
		out = new Date(unix ? toMillis(value) : value);
	} else {
		out = new Date(value);
		// retry as numeric timestamp if string is all digits
		if (Number.isNaN(out.getTime()) && typeof value === 'string' && /^\d+$/.test(value)) {
			const num = Number(value);
			out = new Date(unix ? toMillis(num) : num);
		}
	}
	if (Number.isNaN(out.getTime())) {
		if (strict) {
			throw new Error(`Invalid date: ${value}`);
		}
		return undefined;
	}
	return out;
}

// < 1e10 is unix timestamp in seconds, convert to milliseconds
function toMillis(n: number): number {
	return n < 1e10 ? n * 1000 : n;
}
