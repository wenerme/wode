import { parseRelativeTime } from './parseRelativeTime';

export function parseDate(s: number | string | undefined | null | Date): Date | undefined {
	let out: Date | undefined;
	if (!s) {
		return undefined;
	} else if (s instanceof Date) {
		out = s;
	} else if (typeof s === 'number') {
		out = new Date(s);
	} else if (!s.startsWith('now')) {
		out = new Date(s);
	} else {
		return parseRelativeTime(s);
	}
	if (isNaN(out.getTime())) {
		throw new Error(`Invalid date: ${s}`);
	}
	return out;
}
