import { formatNumber } from './formatNumber';

/**
 * Format a percentage, removing trailing zeros
 * @param value - number (0-1 or 0-100)
 * @param decimals - decimal places to keep, default 2
 * @param isRatio - whether value is a ratio (0-1), default false
 *
 * @example
 * formatPercent(0.5, 2, true) // "50"
 * formatPercent(50.00) // "50"
 * formatPercent(33.33) // "33.33"
 */
export function formatPercent(value: number, decimals = 2, isRatio = false): string {
	const percent = isRatio ? value * 100 : value;
	return formatNumber(percent, decimals);
}
