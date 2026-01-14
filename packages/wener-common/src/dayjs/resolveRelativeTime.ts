import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import weekOfYear from 'dayjs/plugin/weekOfYear';

dayjs.extend(duration);
dayjs.extend(quarterOfYear);
dayjs.extend(weekOfYear);

/**
 * Resolves a Grafana-style relative time string and returns the corresponding Date.
 *
 * @param s - The relative time string to parse (must start with "now")
 * @param now - Optional reference date. If undefined, uses current time
 * @returns The calculated Date based on the relative time expression
 *
 * @throws {Error} When the format is invalid or contains unsupported operators/units
 *
 * ## Syntax
 *
 * All expressions must start with `now` followed by optional operations:
 *
 * ### Operators
 * - `-` - Subtraction (e.g., `now-1h` for one hour ago)
 * - `+` - Addition (e.g., `now+1d` for one day from now)
 * - `/` - Truncation to beginning of time unit (e.g., `now/d` for start of current day)
 * - `\` - Truncation to end of time unit (e.g., `now\d` for end of current day)
 *
 * ### Time Units
 * - `s` - seconds
 * - `m` - minutes
 * - `h` - hours
 * - `d` - days
 * - `w` - weeks
 * - `M` - months
 * - `Q` - quarters
 * - `y` - years
 *
 * ### Operations
 * Operations are processed sequentially from left to right:
 * - **Addition/Subtraction**: `now±{count}{unit}` (e.g., `now-24h`, `now+1d`)
 * - **Truncation to start**: `now/{unit}` (e.g., `now/d`, `now/M`)
 * - **Truncation to end**: `now\{unit}` (e.g., `now\d`, `now\M`)
 * - **Complex**: Multiple operations can be chained (e.g., `now-1M/M`, `now\d`, `now-1y\y`)
 *
 * @example
 * ```typescript
 * // Basic usage
 * resolveRelativeTime('now')           // Current time
 * resolveRelativeTime('now-1h')        // One hour ago
 * resolveRelativeTime('now+1d')        // One day from now
 * resolveRelativeTime('now/d')         // Start of current day
 * resolveRelativeTime('now\\d')        // End of current day
 *
 * // Common patterns
 * resolveRelativeTime('now-24h')       // Last 24 hours
 * resolveRelativeTime('now-7d')        // Last 7 days
 * resolveRelativeTime('now/M')         // Start of current month
 * resolveRelativeTime('now\\M')        // End of current month
 * resolveRelativeTime('now-1M/M')      // Start of previous month
 * resolveRelativeTime('now-1M\\M')     // End of previous month
 * resolveRelativeTime('now/w')         // Start of current week
 * resolveRelativeTime('now\\w')        // End of current week
 * resolveRelativeTime('now/y')         // Start of current year
 * resolveRelativeTime('now\\y')        // End of current year
 *
 * // Complex expressions
 * resolveRelativeTime('now/d+1d-1s')   // End of current day (alternative method)
 * resolveRelativeTime('now\\d')        // End of current day (direct method)
 * resolveRelativeTime('now-1w+2d-3h')  // 1 week ago, plus 2 days, minus 3 hours
 *
 * // With reference date
 * const refDate = new Date('2024-03-15T14:30:45.123Z');
 * resolveRelativeTime('now-1h', refDate);  // One hour before reference date
 * resolveRelativeTime('now\\d', refDate);  // End of reference day
 * ```
 */
export function resolveRelativeTime(s: string | Date | number, now?: Date | undefined): Date {
	{
		let out: Date | undefined;
		if (!s) {
		} else if (s instanceof Date) {
			out = s;
		} else if (typeof s === 'number') {
			out = new Date(s);
		} else if (!s.startsWith('now')) {
			out = new Date(s);
		}
		if (out) {
			if (Number.isNaN(out.getTime())) {
				throw new Error(`Invalid date: ${s}`);
			}
			return out;
		}
	}

	if (typeof s !== 'string' || !s.startsWith('now')) {
		throw new Error(`Invalid relative time format: ${s}`);
	}

	let current = dayjs(now);
	const remaining = s.slice(3); // Remove 'now'

	if (!remaining) {
		return current.toDate();
	}

	// Split by operators while keeping them in the result
	const parts = remaining.split(/([+\-/\\])/).filter((part) => part !== '');

	for (let i = 0; i < parts.length; i += 2) {
		const operator = parts[i];
		const operand = parts[i + 1];

		if (!operator || !operand) {
			throw new Error(`Invalid relative time format: ${s}`);
		}

		if (operator === '/') {
			// Truncation to start operation
			checkDurationUnit(operand);
			current = current.startOf(operand);
		} else if (operator === '\\') {
			// Truncation to end operation
			checkDurationUnit(operand);
			current = current.endOf(operand);
		} else {
			// Addition or subtraction operation
			const match = operand.match(/^(\d+)([smhdwMQy])$/);
			if (!match) {
				throw new Error(`Invalid time operand: ${operand}`);
			}

			const [, amountStr, unit] = match;
			checkDurationUnit(unit);
			const amount = parseInt(amountStr, 10);

			if (operator === '+') {
				current = current.add(amount, unit as 'w');
			} else if (operator === '-') {
				current = current.subtract(amount, unit as 'Q');
			} else {
				throw new Error(`Invalid operator: ${operator}`);
			}
		}
	}

	return current.toDate();
}

/** Array of all valid time units */
export const RelativeDurationUnits = ['ms', 's', 'm', 'h', 'd', 'w', 'M', 'Q', 'y'] as const;

/** Valid time units for relative time expressions */
export type RelativeDurationUnit = (typeof RelativeDurationUnits)[number];

/**
 * Type guard to validate and assert that a string is a valid time unit.
 *
 * @param u - The string to check
 * @throws {Error} When the unit is not supported
 */
export function checkDurationUnit(u: string): asserts u is RelativeDurationUnit {
	if (!RelativeDurationUnits.includes(u as RelativeDurationUnit)) {
		throw new Error(`Invalid unit: ${u}`);
	}
}
