/**
 * Format a number, removing trailing zeros
 * @param value - number or string convertible to number
 * @param decimals - decimal places to keep, default 2
 *
 * @example
 * formatNumber(1.50) // "1.5"
 * formatNumber(1.00) // "1"
 * formatNumber(1.234) // "1.23"
 */
export function formatNumber(value: number | string, decimals = 2): string {
	const num = typeof value === 'string' ? Number.parseFloat(value) : value;
	if (Number.isNaN(num)) return String(value);
	return num
		.toFixed(decimals)
		.replace(/(\.\d*?)0+$/, '$1')
		.replace(/\.$/, '');
}
