import { types } from 'mime-types';
import { describe, expect, it } from 'vite-plus/test';
import { findMimeType } from './findMimeType';
import { GeneratedMimeTypes } from './mimeTypes.generated';

describe('findMimeType', () => {
	it('resolves extensions, paths, query strings, and Windows separators without Node path', () => {
		expect(findMimeType('png')).toBe('image/png');
		expect(findMimeType('/files/REPORT.PDF?download=1')).toBe('application/pdf');
		expect(findMimeType('C:\\files\\notes.md')).toBe('text/markdown');
		expect(findMimeType('photo.heic')).toBe('image/heic');
		expect(findMimeType('site.webmanifest')).toBe('application/manifest+json');
		expect(findMimeType('calendar.ics')).toBe('text/calendar');
		expect(findMimeType('font.eot')).toBe('application/vnd.ms-fontobject');
		expect(findMimeType('audio.aac')).toBe('audio/aac');
	});

	it('returns false for invalid and unknown values', () => {
		expect(findMimeType(undefined)).toBe(false);
		expect(findMimeType('archive.unknown')).toBe(false);
		expect(findMimeType('constructor')).toBe(false);
		expect(findMimeType('__proto__')).toBe(false);
	});

	it('keeps the browser-safe generated table synchronized with mime-types', () => {
		expect(GeneratedMimeTypes).toEqual(
			Object.fromEntries(Object.entries(types).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))),
		);
	});
});
