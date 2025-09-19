import dayjs from 'dayjs';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import weekOfYear from 'dayjs/plugin/weekOfYear';

dayjs.extend(quarterOfYear);
dayjs.extend(weekOfYear);

/**
 * Parses a Grafana-style relative time string and returns the corresponding Date.
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
 * parseRelativeTime('now')           // Current time
 * parseRelativeTime('now-1h')        // One hour ago
 * parseRelativeTime('now+1d')        // One day from now
 * parseRelativeTime('now/d')         // Start of current day
 * parseRelativeTime('now\\d')        // End of current day
 *
 * // Common patterns
 * parseRelativeTime('now-24h')       // Last 24 hours
 * parseRelativeTime('now-7d')        // Last 7 days
 * parseRelativeTime('now/M')         // Start of current month
 * parseRelativeTime('now\\M')        // End of current month
 * parseRelativeTime('now-1M/M')      // Start of previous month
 * parseRelativeTime('now-1M\\M')     // End of previous month
 * parseRelativeTime('now/w')         // Start of current week
 * parseRelativeTime('now\\w')        // End of current week
 * parseRelativeTime('now/y')         // Start of current year
 * parseRelativeTime('now\\y')        // End of current year
 *
 * // Complex expressions
 * parseRelativeTime('now/d+1d-1s')   // End of current day (alternative method)
 * parseRelativeTime('now\\d')        // End of current day (direct method)
 * parseRelativeTime('now-1w+2d-3h')  // 1 week ago, plus 2 days, minus 3 hours
 *
 * // With reference date
 * const refDate = new Date('2024-03-15T14:30:45.123Z');
 * parseRelativeTime('now-1h', refDate);  // One hour before reference date
 * parseRelativeTime('now\\d', refDate);  // End of reference day
 * ```
 */
export function parseRelativeTime(s: string, now?: Date | undefined): Date {
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
			checkUnit(operand);
			current = current.startOf(operand);
		} else if (operator === '\\') {
			// Truncation to end operation
			checkUnit(operand);
			current = current.endOf(operand);
		} else {
			// Addition or subtraction operation
			const match = operand.match(/^(\d+)([smhdwMQy])$/);
			if (!match) {
				throw new Error(`Invalid time operand: ${operand}`);
			}

			const [, amountStr, unit] = match;
			checkUnit(unit);
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

/** Valid time units for relative time expressions */
type Unit = 's' | 'm' | 'h' | 'd' | 'w' | 'M' | 'Q' | 'y';

/** Array of all valid time units */
const Units = ['s', 'm', 'h', 'd', 'w', 'M', 'Q', 'y'] as const;

/**
 * Type guard to validate and assert that a string is a valid time unit.
 *
 * @param u - The string to check
 * @throws {Error} When the unit is not supported
 */
function checkUnit(u: string): asserts u is Unit {
	if (!Units.includes(u as Unit)) {
		throw new Error(`Invalid unit: ${u}`);
	}
}
