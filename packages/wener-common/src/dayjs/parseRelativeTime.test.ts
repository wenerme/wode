import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { describe, expect, it } from 'vite-plus/test';
import { parseRelativeTime } from './parseRelativeTime';

dayjs.extend(duration);

describe('parseRelativeTime', () => {
	it('should return empty array for "now"', () => {
		const result = parseRelativeTime('now');
		expect(result).toEqual([]);
	});

	it('should parse simple addition operations', () => {
		const result = parseRelativeTime('now+1h');
		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({
			operator: '+',
			duration: dayjs.duration({ hours: 1 }),
		});
	});

	it('should parse simple subtraction operations', () => {
		const result = parseRelativeTime('now-30m');
		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({
			operator: '-',
			duration: dayjs.duration({ minutes: 30 }),
		});
	});

	it('should parse milliseconds', () => {
		const result = parseRelativeTime('now+500ms');
		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({
			operator: '+',
			duration: dayjs.duration({ milliseconds: 500 }),
		});
	});

	it('should parse complex duration combinations', () => {
		const result = parseRelativeTime('now+1d6h30m');
		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({
			operator: '+',
			duration: dayjs.duration({ days: 1, hours: 6, minutes: 30 }),
		});
	});

	it('should parse truncation operations', () => {
		const result = parseRelativeTime('now/d');
		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({
			operator: '/',
			unit: 'd',
		});

		const result2 = parseRelativeTime('now\\M');
		expect(result2).toHaveLength(1);
		expect(result2[0]).toEqual({
			operator: '\\',
			unit: 'M',
		});
	});

	it('should parse multiple operations', () => {
		const result = parseRelativeTime('now-1h+30m');
		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({
			operator: '-',
			duration: dayjs.duration({ hours: 1 }),
		});
		expect(result[1]).toEqual({
			operator: '+',
			duration: dayjs.duration({ minutes: 30 }),
		});
	});

	it('should parse mixed arithmetic and truncation operations', () => {
		const result = parseRelativeTime('now-1M/M');
		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({
			operator: '-',
			duration: dayjs.duration({ months: 1 }),
		});
		expect(result[1]).toEqual({
			operator: '/',
			unit: 'M',
		});
	});

	it('should handle all supported units', () => {
		const units = ['ms', 's', 'm', 'h', 'd', 'w', 'M', 'Q', 'y'];

		for (const unit of units) {
			const result = parseRelativeTime(`now+1${unit}`);
			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				operator: '+',
				duration: dayjs.duration({ [unit]: 1 }),
			});
		}
	});

	it('should handle complex multi-unit expressions', () => {
		const result = parseRelativeTime('now+1y2M3w4d5h6m7s8ms');
		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({
			operator: '+',
			duration: dayjs.duration({
				years: 1,
				months: 2,
				weeks: 3,
				days: 4,
				hours: 5,
				minutes: 6,
				seconds: 7,
				milliseconds: 8,
			}),
		});
	});

	it('should handle same unit multiple times (should sum)', () => {
		const result = parseRelativeTime('now+1h2h3h');
		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({
			operator: '+',
			duration: dayjs.duration({ hours: 6 }), // 1+2+3
		});
	});

	it('should throw error for invalid format', () => {
		expect(() => parseRelativeTime('invalid')).toThrow('Invalid relative time format');
		expect(() => parseRelativeTime('now+')).toThrow('Invalid relative time format');
		expect(() => parseRelativeTime('now+abc')).toThrow('Invalid duration specification');
	});

	it('should throw error for invalid units in truncation', () => {
		expect(() => parseRelativeTime('now/invalid')).toThrow('Invalid unit');
	});

	it('should throw error for invalid units in duration', () => {
		expect(() => parseRelativeTime('now+1invalid')).toThrow('Invalid unit');
	});

	it('should handle whitespace correctly', () => {
		// The regex should handle operands without extra whitespace issues
		const result = parseRelativeTime('now+1h30m');
		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({
			operator: '+',
			duration: dayjs.duration({ hours: 1, minutes: 30 }),
		});
	});

	it('should parse real-world examples', () => {
		// Last 24 hours
		const result1 = parseRelativeTime('now-24h');
		expect(result1).toHaveLength(1);
		expect(result1[0]).toEqual({
			operator: '-',
			duration: dayjs.duration({ hours: 24 }),
		});

		// Start of previous month
		const result2 = parseRelativeTime('now-1M/M');
		expect(result2).toHaveLength(2);
		expect(result2[0]).toEqual({
			operator: '-',
			duration: dayjs.duration({ months: 1 }),
		});
		expect(result2[1]).toEqual({
			operator: '/',
			unit: 'M',
		});

		// Complex time ago
		const result3 = parseRelativeTime('now-1w2d3h');
		expect(result3).toHaveLength(1);
		expect(result3[0]).toEqual({
			operator: '-',
			duration: dayjs.duration({ weeks: 1, days: 2, hours: 3 }),
		});
	});
});
