/**
 * Parse time range from string inputs
 */
export function parseTimeRange(from?: string, to?: string): { fromMs: number; toMs: number } {
	const now = Date.now();
	let fromMs = now - 3600 * 1000; // default: 1 hour ago
	let toMs = now;

	if (from) {
		fromMs = parseTime(from, now);
	}
	if (to) {
		toMs = parseTime(to, now);
	}

	return { fromMs, toMs };
}

function parseTime(input: string, now: number): number {
	if (!input) return now;

	// Handle "now" based formats: now, now-1h, now/d
	if (input.startsWith('now')) {
		return parseNowTime(input, now);
	}

	// Simple relative time: -1h, -30m, -1d, -7d, etc.
	const relativeMatch = input.match(/^-(\d+)([smhdwMy])$/i);
	if (relativeMatch) {
		const value = parseInt(relativeMatch[1], 10);
		const unit = relativeMatch[2];
		return now - value * getUnitMs(unit);
	}

	// Try parsing as ISO8601
	const parsed = Date.parse(input);
	if (!Number.isNaN(parsed)) {
		return parsed;
	}

	// Try as unix timestamp
	const asNumber = Number(input);
	if (!Number.isNaN(asNumber)) {
		return asNumber < 2000000000 ? asNumber * 1000 : asNumber;
	}

	return now;
}

function parseNowTime(input: string, now: number): number {
	let result = now;
	const remaining = input.slice(3); // Remove 'now'

	if (!remaining) return result;

	// Parse operators: +, -, /
	const parts = remaining.split(/([+\-/])/).filter((p) => p !== '');

	for (let i = 0; i < parts.length; i += 2) {
		const operator = parts[i];
		const operand = parts[i + 1];
		if (!operator || !operand) break;

		if (operator === '/') {
			// Truncate to start of unit
			const date = new Date(result);
			switch (operand) {
				case 'd':
					date.setHours(0, 0, 0, 0);
					break;
				case 'h':
					date.setMinutes(0, 0, 0);
					break;
				case 'm':
					date.setSeconds(0, 0);
					break;
				case 'M':
					date.setDate(1);
					date.setHours(0, 0, 0, 0);
					break;
				case 'y':
					date.setMonth(0, 1);
					date.setHours(0, 0, 0, 0);
					break;
			}
			result = date.getTime();
		} else {
			const match = operand.match(/^(\d+)([smhdwMy])$/);
			if (match) {
				const amount = parseInt(match[1], 10);
				const unit = match[2];
				const delta = amount * getUnitMs(unit);
				result = operator === '+' ? result + delta : result - delta;
			}
		}
	}

	return result;
}

function getUnitMs(unit: string): number {
	const units: Record<string, number> = {
		s: 1000,
		m: 60 * 1000,
		h: 60 * 60 * 1000,
		d: 24 * 60 * 60 * 1000,
		w: 7 * 24 * 60 * 60 * 1000,
		M: 30 * 24 * 60 * 60 * 1000,
		y: 365 * 24 * 60 * 60 * 1000,
	};
	return units[unit] || 0;
}

/**
 * Format time to BTime format: YYYY-mm-dd HH:MM:SS.FFF (UTC+8)
 * Accepts: ISO8601, milliseconds, or already formatted string
 */
export function formatBTime(input: string): string {
	// Already in correct format: YYYY-mm-dd HH:MM:SS.FFF
	if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}$/.test(input)) {
		return input;
	}

	let ms: number;

	// Try as milliseconds timestamp
	const asNumber = Number(input);
	if (!Number.isNaN(asNumber) && asNumber > 1000000000000) {
		ms = asNumber;
	} else if (!Number.isNaN(asNumber) && asNumber > 1000000000) {
		// Seconds timestamp
		ms = asNumber * 1000;
	} else {
		// Try parsing as ISO8601 or other date format
		const parsed = Date.parse(input);
		if (!Number.isNaN(parsed)) {
			ms = parsed;
		} else {
			throw new Error(`Invalid time format: ${input}. Expected ISO8601, milliseconds, or YYYY-mm-dd HH:MM:SS.FFF`);
		}
	}

	// Convert to UTC+8
	const date = new Date(ms);
	const utc8Offset = 8 * 60 * 60 * 1000;
	const utc8Date = new Date(date.getTime() + utc8Offset);

	// Format as YYYY-mm-dd HH:MM:SS.FFF
	const iso = utc8Date.toISOString();
	return iso.replace('T', ' ').replace('Z', '').slice(0, 23);
}

/**
 * Convert data to TOON format for compact output
 * https://github.com/toon-format/toon
 */
export function toToon(data: any): string {
	return toToonValue(data, 0);
}

function toToonValue(value: any, indent: number): string {
	if (value === null || value === undefined) return 'null';
	if (typeof value === 'boolean') return value ? 'true' : 'false';
	if (typeof value === 'number') return String(value);
	if (typeof value === 'string') {
		// Simple strings without special chars can be unquoted
		if (/^[a-zA-Z0-9_\-.:/@]+$/.test(value) && value.length < 60) {
			return value;
		}
		// Multi-line or complex strings
		if (value.includes('\n') || value.length > 80) {
			return `"""\n${value}\n"""`;
		}
		return JSON.stringify(value);
	}
	if (Array.isArray(value)) {
		if (value.length === 0) return '[]';
		const items = value.map((v) => toToonValue(v, indent + 1));
		if (items.every((i) => !i.includes('\n') && i.length < 40) && items.join(' ').length < 80) {
			return `[${items.join(' ')}]`;
		}
		const pad = '  '.repeat(indent + 1);
		return `[\n${items.map((i) => `${pad}${i}`).join('\n')}\n${'  '.repeat(indent)}]`;
	}
	if (typeof value === 'object') {
		const entries = Object.entries(value).filter(([, v]) => v !== undefined);
		if (entries.length === 0) return '{}';
		const pad = '  '.repeat(indent + 1);
		const lines = entries.map(([k, v]) => {
			const keyStr = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(k) ? k : JSON.stringify(k);
			const valStr = toToonValue(v, indent + 1);
			return `${pad}${keyStr}: ${valStr}`;
		});
		return `{\n${lines.join('\n')}\n${'  '.repeat(indent)}}`;
	}
	return String(value);
}
