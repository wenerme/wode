import { describe, expect, it } from 'vitest';
import { editApolloDocument, parseApolloDocumentPath } from './document-edit';

const config = `server:
  http:
    addr: example.test:8000 # listen address
    timeout: 7200s
  grpc:
    addr: example.test:9000
data:
  # kafka sinks
  topics:
    - a
    - b
`;

describe('editApolloDocument', () => {
	it('replaces a YAML set with a plain empty object instead of silently skipping the edit', () => {
		const result = editApolloDocument({
			format: 'yaml', text: 'tags: !!set\n  old: null\n', set: [{ path: 'tags', value: {} }],
		});
		expect(result.text).toBe('tags: {}\n');
		expect(result.changes[0]?.changed).toBe('yes');
	});

	it('adds a nested block by path while keeping comments, order and sequence indentation', () => {
		const result = editApolloDocument({
			format: 'yaml',
			text: config,
			set: [
				{ path: 'server.otel.enabled', value: true },
				{ path: 'server.otel.sample_ratio', value: 1 },
			],
		});
		expect(result.text).toBe(
			config.replace(
				'    addr: example.test:9000\n',
				'    addr: example.test:9000\n  otel:\n    enabled: true\n    sample_ratio: 1\n',
			),
		);
		expect(result.changes).toEqual([
			{ key: 'server.otel.enabled', op: 'create', newValue: true, changed: 'yes' },
			{ key: 'server.otel.sample_ratio', op: 'create', newValue: 1, changed: 'yes' },
		]);
		expect(result.reformatted).toBe(false);
	});

	it('deep-merges fragments, updates scalars in place and deletes paths', () => {
		const result = editApolloDocument({
			format: 'yaml',
			text: config,
			merge: [{ server: { http: { timeout: '30s' }, otel: { enabled: true } } }],
			delete: ['server.grpc', 'missing.key'],
		});
		expect(result.text).toContain('    addr: example.test:8000 # listen address\n    timeout: 30s\n');
		expect(result.text).toContain('  otel:\n    enabled: true\n');
		expect(result.text).not.toContain('grpc');
		expect(result.text).toContain('  # kafka sinks\n');
		expect(result.changes).toEqual([
			{ key: 'server.http.timeout', op: 'update', oldValue: '7200s', newValue: '30s', changed: 'yes' },
			{ key: 'server.otel.enabled', op: 'create', newValue: true, changed: 'yes' },
			{ key: 'server.grpc', op: 'delete', oldValue: { addr: 'example.test:9000' }, changed: 'yes' },
			{ key: 'missing.key', op: 'delete', changed: '' },
		]);
	});

	it('returns the source untouched when every operation is a no-op', () => {
		const result = editApolloDocument({
			format: 'yaml',
			text: config,
			set: [{ path: 'server.http.timeout', value: '7200s' }],
		});
		expect(result.text).toBe(config);
		expect(result.changes).toEqual([
			{ key: 'server.http.timeout', op: 'update', oldValue: '7200s', newValue: '7200s', changed: '' },
		]);
	});

	it('edits JSON documents and keeps their indentation', () => {
		const result = editApolloDocument({
			format: 'json',
			text: '{\n    "limit": 10\n}\n',
			set: [{ path: 'server.otel.enabled', value: true }],
		});
		expect(result.text).toBe(
			'{\n    "limit": 10,\n    "server": {\n        "otel": {\n            "enabled": true\n        }\n    }\n}\n',
		);
	});

	it('creates content for empty documents and replaces null parents', () => {
		expect(editApolloDocument({ format: 'yaml', text: '', set: [{ path: 'a.b', value: 1 }] }).text).toBe(
			'a:\n  b: 1\n',
		);
		expect(editApolloDocument({ format: 'yaml', text: 'a:\n', set: [{ path: 'a.b', value: 1 }] }).text).toBe(
			'a:\n  b: 1\n',
		);
		expect(editApolloDocument({ format: 'yaml', text: 'null\n', set: [{ path: 'a.b', value: 1 }] }).text).toBe(
			'a:\n  b: 1\n',
		);
		expect(editApolloDocument({ format: 'json', text: 'null', set: [{ path: 'a', value: 1 }] }).text).toBe('{"a":1}');
	});

	it('rejects scalar parents, invalid sources and unsafe paths', () => {
		expect(() => editApolloDocument({ format: 'yaml', text: 'a: 1\n', set: [{ path: 'a.b', value: 1 }] })).toThrow(
			'cannot set a.b: a is a scalar value, not a map',
		);
		expect(() => editApolloDocument({ format: 'yaml', text: 'a: [1\n', set: [{ path: 'a', value: 1 }] })).toThrow(
			/not valid YAML/u,
		);
		expect(() => editApolloDocument({ format: 'json', text: '{', set: [{ path: 'a', value: 1 }] })).toThrow(
			/not valid JSON/u,
		);
		expect(() => parseApolloDocumentPath('a.__proto__.b')).toThrow(/unsafe/u);
		expect(() => parseApolloDocumentPath('a..b')).toThrow(/invalid/u);
		expect(parseApolloDocumentPath('list[0].name')).toEqual(['list', '0', 'name']);
	});
});
