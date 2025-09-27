import dayjs from 'dayjs';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import { describe, expect, it } from 'vitest';
import { resolveRelativeTime } from './resolveRelativeTime';

dayjs.extend(quarterOfYear);
dayjs.extend(weekOfYear);

describe('resolveRelativeTime', () => {
	const fixedDate = new Date('2024-03-15T14:30:45.123Z');

	describe('basic cases', () => {
		it('should handle "now"', () => {
			const result = resolveRelativeTime('now', fixedDate);
			expect(result).toEqual(fixedDate);
		});

		it('should handle "now" without reference date', () => {
			const result = resolveRelativeTime('now', undefined);
			expect(result).toBeInstanceOf(Date);
		});
	});

	describe('subtraction operations', () => {
		it('should subtract seconds', () => {
			const result = resolveRelativeTime('now-30s', fixedDate);
			const expected = dayjs(fixedDate).subtract(30, 'second').toDate();
			expect(result).toEqual(expected);
		});

		it('should subtract minutes', () => {
			const result = resolveRelativeTime('now-15m', fixedDate);
			const expected = dayjs(fixedDate).subtract(15, 'minute').toDate();
			expect(result).toEqual(expected);
		});

		it('should subtract hours', () => {
			const result = resolveRelativeTime('now-2h', fixedDate);
			const expected = dayjs(fixedDate).subtract(2, 'hour').toDate();
			expect(result).toEqual(expected);
		});

		it('should subtract days', () => {
			const result = resolveRelativeTime('now-7d', fixedDate);
			const expected = dayjs(fixedDate).subtract(7, 'day').toDate();
			expect(result).toEqual(expected);
		});

		it('should subtract weeks', () => {
			const result = resolveRelativeTime('now-2w', fixedDate);
			const expected = dayjs(fixedDate).subtract(2, 'week').toDate();
			expect(result).toEqual(expected);
		});

		it('should subtract months', () => {
			const result = resolveRelativeTime('now-1M', fixedDate);
			const expected = dayjs(fixedDate).subtract(1, 'month').toDate();
			expect(result).toEqual(expected);
		});

		it('should subtract quarters', () => {
			const result = resolveRelativeTime('now-1Q', fixedDate);
			const expected = dayjs(fixedDate).subtract(1, 'quarter').toDate();
			expect(result).toEqual(expected);
		});

		it('should subtract years', () => {
			const result = resolveRelativeTime('now-1y', fixedDate);
			const expected = dayjs(fixedDate).subtract(1, 'year').toDate();
			expect(result).toEqual(expected);
		});
	});

	describe('addition operations', () => {
		it('should add seconds', () => {
			const result = resolveRelativeTime('now+30s', fixedDate);
			const expected = dayjs(fixedDate).add(30, 'second').toDate();
			expect(result).toEqual(expected);
		});

		it('should add minutes', () => {
			const result = resolveRelativeTime('now+15m', fixedDate);
			const expected = dayjs(fixedDate).add(15, 'minute').toDate();
			expect(result).toEqual(expected);
		});

		it('should add hours', () => {
			const result = resolveRelativeTime('now+3h', fixedDate);
			const expected = dayjs(fixedDate).add(3, 'hour').toDate();
			expect(result).toEqual(expected);
		});

		it('should add days', () => {
			const result = resolveRelativeTime('now+5d', fixedDate);
			const expected = dayjs(fixedDate).add(5, 'day').toDate();
			expect(result).toEqual(expected);
		});

		it('should add weeks', () => {
			const result = resolveRelativeTime('now+2w', fixedDate);
			const expected = dayjs(fixedDate).add(2, 'week').toDate();
			expect(result).toEqual(expected);
		});

		it('should add months', () => {
			const result = resolveRelativeTime('now+2M', fixedDate);
			const expected = dayjs(fixedDate).add(2, 'month').toDate();
			expect(result).toEqual(expected);
		});

		it('should add quarters', () => {
			const result = resolveRelativeTime('now+1Q', fixedDate);
			const expected = dayjs(fixedDate).add(1, 'quarter').toDate();
			expect(result).toEqual(expected);
		});

		it('should add years', () => {
			const result = resolveRelativeTime('now+1y', fixedDate);
			const expected = dayjs(fixedDate).add(1, 'year').toDate();
			expect(result).toEqual(expected);
		});
	});

	describe('truncation operations', () => {
		it('should truncate to start of second', () => {
			const result = resolveRelativeTime('now/s', fixedDate);
			const expected = dayjs(fixedDate).startOf('second').toDate();
			expect(result).toEqual(expected);
		});

		it('should truncate to start of minute', () => {
			const result = resolveRelativeTime('now/m', fixedDate);
			const expected = dayjs(fixedDate).startOf('minute').toDate();
			expect(result).toEqual(expected);
		});

		it('should truncate to start of hour', () => {
			const result = resolveRelativeTime('now/h', fixedDate);
			const expected = dayjs(fixedDate).startOf('hour').toDate();
			expect(result).toEqual(expected);
		});

		it('should truncate to start of day', () => {
			const result = resolveRelativeTime('now/d', fixedDate);
			const expected = dayjs(fixedDate).startOf('day').toDate();
			expect(result).toEqual(expected);
		});

		it('should truncate to start of week', () => {
			const result = resolveRelativeTime('now/w', fixedDate);
			const expected = dayjs(fixedDate).startOf('week').toDate();
			expect(result).toEqual(expected);
		});

		it('should truncate to start of month', () => {
			const result = resolveRelativeTime('now/M', fixedDate);
			const expected = dayjs(fixedDate).startOf('month').toDate();
			expect(result).toEqual(expected);
		});

		it('should truncate to start of quarter', () => {
			const result = resolveRelativeTime('now/Q', fixedDate);
			const expected = dayjs(fixedDate).startOf('quarter').toDate();
			expect(result).toEqual(expected);
		});

		it('should truncate to start of year', () => {
			const result = resolveRelativeTime('now/y', fixedDate);
			const expected = dayjs(fixedDate).startOf('year').toDate();
			expect(result).toEqual(expected);
		});
	});

	describe('endOf truncation operations (backslash)', () => {
		it('should truncate to end of second', () => {
			const result = resolveRelativeTime('now\\s', fixedDate);
			const expected = dayjs(fixedDate).endOf('second').toDate();
			expect(result).toEqual(expected);
		});

		it('should truncate to end of minute', () => {
			const result = resolveRelativeTime('now\\m', fixedDate);
			const expected = dayjs(fixedDate).endOf('minute').toDate();
			expect(result).toEqual(expected);
		});

		it('should truncate to end of hour', () => {
			const result = resolveRelativeTime('now\\h', fixedDate);
			const expected = dayjs(fixedDate).endOf('hour').toDate();
			expect(result).toEqual(expected);
		});

		it('should truncate to end of day', () => {
			const result = resolveRelativeTime('now\\d', fixedDate);
			const expected = dayjs(fixedDate).endOf('day').toDate();
			expect(result).toEqual(expected);
		});

		it('should truncate to end of week', () => {
			const result = resolveRelativeTime('now\\w', fixedDate);
			const expected = dayjs(fixedDate).endOf('week').toDate();
			expect(result).toEqual(expected);
		});

		it('should truncate to end of month', () => {
			const result = resolveRelativeTime('now\\M', fixedDate);
			const expected = dayjs(fixedDate).endOf('month').toDate();
			expect(result).toEqual(expected);
		});

		it('should truncate to end of quarter', () => {
			const result = resolveRelativeTime('now\\Q', fixedDate);
			const expected = dayjs(fixedDate).endOf('quarter').toDate();
			expect(result).toEqual(expected);
		});

		it('should truncate to end of year', () => {
			const result = resolveRelativeTime('now\\y', fixedDate);
			const expected = dayjs(fixedDate).endOf('year').toDate();
			expect(result).toEqual(expected);
		});
	});

	describe('complex combinations', () => {
		it('should handle "now-1M/M" (start of previous month)', () => {
			const result = resolveRelativeTime('now-1M/M', fixedDate);
			const expected = dayjs(fixedDate).subtract(1, 'month').startOf('month').toDate();
			expect(result).toEqual(expected);
		});

		it('should handle "now/d+1d-1s" (end of current day)', () => {
			const result = resolveRelativeTime('now/d+1d-1s', fixedDate);
			const expected = dayjs(fixedDate).startOf('day').add(1, 'day').subtract(1, 'second').toDate();
			expect(result).toEqual(expected);
		});

		it('should handle multiple operations "now-1w+2d-3h"', () => {
			const result = resolveRelativeTime('now-1w+2d-3h', fixedDate);
			const expected = dayjs(fixedDate).subtract(1, 'week').add(2, 'day').subtract(3, 'hour').toDate();
			expect(result).toEqual(expected);
		});

		it('should handle "now-1M\\M" (end of previous month)', () => {
			const result = resolveRelativeTime('now-1M\\M', fixedDate);
			const expected = dayjs(fixedDate).subtract(1, 'month').endOf('month').toDate();
			expect(result).toEqual(expected);
		});

		it('should handle "now\\d" vs "now/d+1d-1s" (both end of current day)', () => {
			const resultBackslash = resolveRelativeTime('now\\d', fixedDate);
			const resultAlternative = resolveRelativeTime('now/d+1d-1s', fixedDate);
			const expectedBackslash = dayjs(fixedDate).endOf('day').toDate();
			const expectedAlternative = dayjs(fixedDate).startOf('day').add(1, 'day').subtract(1, 'second').toDate();

			expect(resultBackslash).toEqual(expectedBackslash);
			expect(resultAlternative).toEqual(expectedAlternative);
			// Note: endOf gives millisecond precision (.999), while alternative gives second precision (.000)
			// Both represent end of day, but endOf is more precise
			expect(resultBackslash.getTime()).toBeGreaterThan(resultAlternative.getTime());
		});

		it('should handle "now-1y\\y" (end of previous year)', () => {
			const result = resolveRelativeTime('now-1y\\y', fixedDate);
			const expected = dayjs(fixedDate).subtract(1, 'year').endOf('year').toDate();
			expect(result).toEqual(expected);
		});

		it('should handle "now/y+6M" (middle of current year)', () => {
			const result = resolveRelativeTime('now/y+6M', fixedDate);
			const expected = dayjs(fixedDate).startOf('year').add(6, 'month').toDate();
			expect(result).toEqual(expected);
		});
	});

	describe('error cases', () => {
		it('should throw error for invalid format', () => {
			expect(() => resolveRelativeTime('invalid', fixedDate)).toThrow('Invalid');
		});

		it('should throw error for non-now start', () => {
			expect(() => resolveRelativeTime('then-1h', fixedDate)).toThrow('Invalid');
		});

		it('should throw error for invalid time unit', () => {
			expect(() => resolveRelativeTime('now-1x', fixedDate)).toThrow('Invalid time operand');
		});

		it('should throw error for invalid operator', () => {
			expect(() => resolveRelativeTime('now*1h', fixedDate)).toThrow('Invalid relative time format');
		});

		it('should throw error for invalid truncation unit', () => {
			expect(() => resolveRelativeTime('now/z', fixedDate)).toThrow();
		});

		it('should throw error for incomplete operation', () => {
			expect(() => resolveRelativeTime('now-', fixedDate)).toThrow('Invalid relative time format');
		});
	});

	describe('Grafana examples from comments', () => {
		it('should handle "now-24h" (last 24 hours)', () => {
			const result = resolveRelativeTime('now-24h', fixedDate);
			const expected = dayjs(fixedDate).subtract(24, 'hour').toDate();
			expect(result).toEqual(expected);
		});

		it('should handle "now/M" (start of current month)', () => {
			const result = resolveRelativeTime('now/M', fixedDate);
			const expected = dayjs(fixedDate).startOf('month').toDate();
			expect(result).toEqual(expected);
		});

		it('should handle "now-7d" (last 7 days)', () => {
			const result = resolveRelativeTime('now-7d', fixedDate);
			const expected = dayjs(fixedDate).subtract(7, 'day').toDate();
			expect(result).toEqual(expected);
		});

		it('should handle "now/y" (start of current year)', () => {
			const result = resolveRelativeTime('now/y', fixedDate);
			const expected = dayjs(fixedDate).startOf('year').toDate();
			expect(result).toEqual(expected);
		});

		it('should handle "now/w" (start of current week)', () => {
			const result = resolveRelativeTime('now/w', fixedDate);
			const expected = dayjs(fixedDate).startOf('week').toDate();
			expect(result).toEqual(expected);
		});

		it('should handle "now\\d" (end of current day)', () => {
			const result = resolveRelativeTime('now\\d', fixedDate);
			const expected = dayjs(fixedDate).endOf('day').toDate();
			expect(result).toEqual(expected);
		});

		it('should handle "now\\M" (end of current month)', () => {
			const result = resolveRelativeTime('now\\M', fixedDate);
			const expected = dayjs(fixedDate).endOf('month').toDate();
			expect(result).toEqual(expected);
		});

		it('should handle "now\\w" (end of current week)', () => {
			const result = resolveRelativeTime('now\\w', fixedDate);
			const expected = dayjs(fixedDate).endOf('week').toDate();
			expect(result).toEqual(expected);
		});

		it('should handle "now\\y" (end of current year)', () => {
			const result = resolveRelativeTime('now\\y', fixedDate);
			const expected = dayjs(fixedDate).endOf('year').toDate();
			expect(result).toEqual(expected);
		});
	});
});
