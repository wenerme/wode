import Decimal from 'decimal.js';

export function parseDecimal(v: string | number | Decimal): Decimal;
export function parseDecimal(v: string | number | Decimal | undefined | null): Decimal | undefined;
export function parseDecimal(v: string | number | Decimal | undefined | null): Decimal | undefined {
	switch (v) {
		case '':
		case undefined:
		case null:
			return undefined;
	}
	if (Decimal.isDecimal(v)) {
		return v;
	}
	return new Decimal(v);
}
