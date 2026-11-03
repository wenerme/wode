import { describe, expect, it } from 'vitest';
import { ApolloFormattingOnlyKey, diffApolloConfigurations, formatApolloConfigPath } from './config-diff';

describe('diffApolloConfigurations', () => {
	it('diffs properties by key', () => {
		expect(
			diffApolloConfigurations('properties', { a: '1', b: '2', gone: 'x' }, { a: '1', b: '3', added: 'y' }),
		).toEqual([
			{ key: 'b', op: 'update', oldValue: '2', newValue: '3' },
			{ key: 'added', op: 'create', newValue: 'y' },
			{ key: 'gone', op: 'delete', oldValue: 'x' },
		]);
	});

	it('diffs yaml structurally by leaf path instead of text', () => {
		const base = 'server:\n  http: {addr: ":8000"}\nlist: [a, b]\nold: {x: 1, y: 2}\n';
		const next = 'server:\n  http: {addr: ":9000"}\n  otel: {enabled: true, sample_ratio: 1}\nlist: [a, c]\n';
		expect(diffApolloConfigurations('yaml', { content: base }, { content: next })).toEqual([
			{ key: 'server.http.addr', op: 'update', oldValue: ':8000', newValue: ':9000' },
			{ key: 'server.otel.enabled', op: 'create', newValue: true },
			{ key: 'server.otel.sample_ratio', op: 'create', newValue: 1 },
			{ key: 'list[1]', op: 'update', oldValue: 'b', newValue: 'c' },
			{ key: 'old.x', op: 'delete', oldValue: 1 },
			{ key: 'old.y', op: 'delete', oldValue: 2 },
		]);
	});

	it('treats arrays of different length as one value and json like yaml', () => {
		expect(diffApolloConfigurations('json', { content: '{"a":[1]}' }, { content: '{"a":[1,2]}' })).toEqual([
			{ key: 'a', op: 'update', oldValue: [1], newValue: [1, 2] },
		]);
	});

	it('reports comment-only edits, invalid documents and plain text', () => {
		expect(diffApolloConfigurations('yaml', { content: 'a: 1\n' }, { content: '# note\na: 1\n' })).toEqual([
			{ key: ApolloFormattingOnlyKey, op: 'update' },
		]);
		expect(diffApolloConfigurations('yaml', { content: 'a: [1' }, { content: 'a: 1' })).toEqual([
			{ key: 'content', op: 'update', oldValue: 'a: [1', newValue: 'a: 1' },
		]);
		expect(diffApolloConfigurations('txt', { content: 'x' }, { content: 'x' })).toEqual([]);
		expect(diffApolloConfigurations('yaml', {}, { content: 'a: 1\n' })).toEqual([
			{ key: 'a', op: 'create', newValue: 1 },
		]);
	});

	it('formats paths for keys that need quoting', () => {
		expect(formatApolloConfigPath(['models', 0, 'x.y', 'ok'])).toBe('models[0]["x.y"].ok');
		expect(formatApolloConfigPath([])).toBe('(root)');
	});
});
