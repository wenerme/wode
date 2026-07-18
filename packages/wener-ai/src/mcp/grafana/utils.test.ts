import { describe, expect, it } from 'vite-plus/test';
import { getByPath, parseGrafanaTime, removeByPath, resolveTimeRange, setByPath } from './utils';

describe('grafana utils', () => {
	it('parses relative grafana time', () => {
		const now = new Date('2026-03-27T12:00:00.000Z');
		expect(parseGrafanaTime('now', now).toISOString()).toBe('2026-03-27T12:00:00.000Z');
		expect(parseGrafanaTime('now-1h', now).toISOString()).toBe('2026-03-27T11:00:00.000Z');
		expect(parseGrafanaTime('2026-03-27T10:00:00Z', now).toISOString()).toBe('2026-03-27T10:00:00.000Z');
	});

	it('resolves a default time range', () => {
		const range = resolveTimeRange({ from: '2026-03-27T10:00:00Z', to: '2026-03-27T11:00:00Z' });
		expect(range.fromIso).toBe('2026-03-27T10:00:00.000Z');
		expect(range.toIso).toBe('2026-03-27T11:00:00.000Z');
	});

	it('gets, sets, and removes json paths', () => {
		const model: Record<string, unknown> = {
			title: 'hello',
			panels: [{ title: 'A' }, { title: 'B' }],
		};

		expect(getByPath(model, '$.title')).toBe('hello');
		expect(getByPath(model, '$.panels[*].title')).toEqual(['A', 'B']);

		setByPath(model, '$.panels[1].title', 'B2');
		setByPath(model, '$.tags/-', 'prod');
		expect(getByPath(model, '$.panels[1].title')).toBe('B2');
		expect(getByPath(model, '$.tags[0]')).toBe('prod');

		removeByPath(model, '$.panels[0]');
		expect(getByPath(model, '$.panels[*].title')).toBe('B2');
	});
});
