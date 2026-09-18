import { describe, expect, it } from 'vite-plus/test';
import {
	formatBoolean,
	formatBytes,
	formatCurrency,
	formatDateTime,
	formatDecimal,
	formatDuration,
	formatNumber,
	formatPercent,
	formatPhoneNumber,
	formatRelativeTime,
	parseDurationMilliseconds,
	parseFiniteNumber,
} from './format-values';

describe('format numeric values', () => {
	it('formats decimal, currency, and percent values with explicit locale semantics', () => {
		expect(formatNumber('12,345.6', { locale: 'en-US' })).toBe('12,345.6');
		expect(formatDecimal('1234', { locale: 'en-US' })).toBe('1,234.00');
		expect(formatCurrency('1234.5', { currency: 'CNY', locale: 'zh-CN' })).toBe('¥1,234.50');
		expect(formatPercent(0.1234, { locale: 'en-US' })).toBe('12.34%');
		expect(formatPercent(12.34, { input: 'percent', locale: 'en-US' })).toBe('12.34%');
	});

	it('rejects unsafe or invalid numeric inputs', () => {
		expect(parseFiniteNumber('')).toBeUndefined();
		expect(parseFiniteNumber('abc')).toBeUndefined();
		expect(parseFiniteNumber(10n)).toBe(10);
		expect(parseFiniteNumber(9007199254740993n)).toBeUndefined();
		expect(formatDecimal('abc')).toBe('—');
	});
});

describe('format bytes and duration values', () => {
	it('formats bytes with decimal and binary unit labels', () => {
		expect(formatBytes(0)).toBe('0 B');
		expect(formatBytes(1536)).toBe('1.54 KB');
		expect(formatBytes(1536, { binary: true })).toBe('1.5 KiB');
		expect(formatBytes(-1536)).toBe('-1.54 KB');
	});

	it('parses object, unit, and string durations', () => {
		expect(parseDurationMilliseconds({ value: 90, unit: 'second' })).toBe(90_000);
		expect(parseDurationMilliseconds({ minutes: 1, seconds: 2, milliseconds: 3 })).toBe(62_003);
		expect(formatDuration({ value: 90, unit: 'second' })).toBe('1m30s');
		expect(formatDuration('PT1H2M3S')).toBe('1h2m');
		expect(formatDuration(3_661_000, { style: 'digital' })).toBe('1:01:01');
		expect(formatDuration(0)).toBe('0ms');
	});
});

describe('format date, boolean, and phone values', () => {
	it('formats deterministic date-time and relative values', () => {
		const value = '2024-01-02T03:04:05.000Z';
		expect(
			formatDateTime(value, {
				dateStyle: 'short',
				locale: 'en-US',
				timeStyle: 'medium',
				timeZone: 'UTC',
			}),
		).toBe('1/2/24, 3:04:05 AM');
		expect(formatRelativeTime(value, { locale: 'en-US', now: '2024-01-02T03:05:05.000Z' })).toBe('1 min. ago');
	});

	it('formats boolean and phone values', () => {
		expect(formatBoolean(true)).toBe('是');
		expect(formatBoolean('off')).toBe('否');
		expect(formatBoolean('unknown')).toBe('—');
		expect(formatPhoneNumber('13800138000')).toBe('138 **** 8000');
		expect(formatPhoneNumber('13800138000', { mask: false, separator: '-' })).toBe('138-0013-8000');
	});

	it('returns fallbacks for invalid Intl options instead of throwing during render', () => {
		expect(formatCurrency(1, { currency: 'x', fallback: 'n/a' })).toBe('n/a');
		expect(formatBytes(1024, { fallback: 'n/a', maximumFractionDigits: -1 })).toBe('n/a');
		expect(formatDateTime('2024-01-02T03:04:05.000Z', { fallback: 'n/a', timeZone: 'bad' })).toBe('n/a');
		expect(formatRelativeTime('2024-01-02T03:04:05.000Z', { fallback: 'n/a', locale: 'bad_locale' })).toBe('n/a');
	});
});
