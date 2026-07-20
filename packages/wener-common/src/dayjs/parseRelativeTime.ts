import dayjs from 'dayjs';
import type { Duration } from 'dayjs/plugin/duration';
import { checkDurationUnit, type RelativeDurationUnit, RelativeDurationUnits } from './resolveRelativeTime';

export type TimeOperation =
	| {
			operator: '+' | '-';
			duration: Duration;
	  }
	| {
			operator: '/' | '\\';
			unit: RelativeDurationUnit;
	  };

/**
 * Parses a relative time string and returns an array of operations.
 *
 * @param s - The relative time string to parse (must start with "now")
 * @returns Array of operations that can be applied sequentially
 * @throws {Error} When the format is invalid
 *
 * @example
 * ```typescript
 * parseRelativeTime('now-1h+30m')    // [{ operator: '-', duration: dayjs.duration(1, 'h') }, { operator: '+', duration: dayjs.duration(30, 'm') }]
 * parseRelativeTime('now+1d6h')      // [{ operator: '+', duration: dayjs.duration({ days: 1, hours: 6 }) }]
 * parseRelativeTime('now/d')         // [{ operator: '/', unit: 'd' }]
 * parseRelativeTime('now\\M')        // [{ operator: '\\', unit: 'M' }]
 * parseRelativeTime('now-1M/M')      // [{ operator: '-', duration: dayjs.duration(1, 'M') }, { operator: '/', unit: 'M' }]
 * parseRelativeTime('now+500ms')     // [{ operator: '+', duration: dayjs.duration(500, 'ms') }]
 * ```
 */
export function parseRelativeTime(s: string): TimeOperation[] {
	if (typeof s !== 'string' || !s.startsWith('now')) {
		throw new Error(`Invalid relative time format: ${s}`);
	}

	const remaining = s.slice(3); // Remove 'now'

	if (!remaining) {
		return [];
	}

	const operations: TimeOperation[] = [];

	// Single regex to match all operations: <op><duration_spec> or <op><unit>
	// Where duration_spec can be: 1h, 1d6h, 500ms, etc.
	const operationRegex = /([+\-/\\])([^+\-/\\]+)/g;
	let match: RegExpExecArray | null;
	let lastIndex = 0;

	while ((match = operationRegex.exec(remaining)) !== null) {
		const [, operator, operand] = match;

		if (operator === '/' || operator === '\\') {
			// Truncation operation - single unit only
			checkDurationUnit(operand.trim());
			operations.push({
				operator: operator as '/' | '\\',
				unit: operand.trim() as RelativeDurationUnit,
			});
		} else {
			// Addition or subtraction operation - parse complex duration
			const parsedDuration = parseDurationSpec(operand.trim());
			operations.push({
				operator: operator as '+' | '-',
				duration: parsedDuration,
			});
		}
		lastIndex = operationRegex.lastIndex;
	}

	// Check if we parsed the entire remaining string
	if (lastIndex < remaining.length) {
		throw new Error(`Invalid relative time format: ${s}`);
	}

	return operations;
}

/**
 * Parses a duration specification like "1h", "1d6h", "500ms" into a dayjs Duration.
 * Supports multiple units in a single specification.
 */
function parseDurationSpec(spec: string): Duration {
	// Match all number+unit pairs: 1d, 6h, 30m, 500ms, etc.
	const durationRegex = /(\d+)(ms|[smhdwMQy])/g;
	const durationObj: Record<string, number> = {};
	let match: RegExpExecArray | null;
	let hasMatch = false;

	while ((match = durationRegex.exec(spec)) !== null) {
		const [, amountStr, unit] = match;
		checkDurationUnit(unit);
		const amount = parseInt(amountStr, 10);

		// Dayjs duration supports unit strings directly
		durationObj[unit] = (durationObj[unit] || 0) + amount;
		hasMatch = true;
	}

	if (!hasMatch) {
		// Check if there are invalid units by looking for number+invalid_unit patterns
		const invalidUnitRegex = /\d+([a-zA-Z]+)/g;
		let invalidMatch: RegExpExecArray | null;
		while ((invalidMatch = invalidUnitRegex.exec(spec)) !== null) {
			const [, unit] = invalidMatch;
			if (!RelativeDurationUnits.includes(unit as RelativeDurationUnit)) {
				throw new Error(`Invalid unit: ${unit}`);
			}
		}
		throw new Error(`Invalid duration specification: ${spec}`);
	}

	return dayjs.duration(durationObj);
}
