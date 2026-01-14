export function parseDate(value: Date | string | undefined | null): Date | undefined {
	if (!value) {
		return undefined;
	}
	if (value instanceof Date) {
		return value;
	}
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		return undefined;
	}
	return parsed;
}
