export function parseBoolean(s: string | boolean | number | null | undefined, strict: true): boolean | undefined;
export function parseBoolean(s: string | boolean | number | null | undefined | any): boolean;
export function parseBoolean(s?: string | boolean | number | null, strict = false): boolean | undefined {
	if (typeof s === 'boolean') {
		return s;
	}
	if (typeof s === 'string') {
		switch (s.toLowerCase()) {
			case 'yes':
			case 'y':
			case 'true':
			case 't':
			case '1':
				return true;
			case 'no':
			case 'n':
			case 'false':
			case 'f':
			case '0':
				return false;
		}
	} else if (typeof s === 'number') {
		switch (s) {
			case 0:
				return false;
			case 1:
				return true;
		}
	}
	if (strict) {
		return undefined;
	}
	return Boolean(s);
}
