import { describe, expect, it, vi } from 'vitest';
import { parseDocument } from 'yaml';
import { redactApolloMessage, redactApolloValue } from '../service/apollo/core/redactor';
import {
	createRedactor,
	getRedactor,
	isSensitive,
	isSensitiveKey,
	type Redactor,
	redact,
	redactMessage,
	redactText,
	redactValue,
	setRedactor,
} from './index';

const token = 'ghp_abcdefghijklmnopqrstuvwxyz012345';
const marker = '<redacted>';

describe('explicit reusable redaction', () => {
	it('matches normalized sensitive keys without matching ordinary key names', () => {
		for (const key of [
			'dbPassword',
			'APIKey',
			'api_key',
			'api-key',
			'secret.key',
			'privateKey',
			'set-cookie',
			'readDsn',
		]) {
			expect(isSensitiveKey(key), key).toBe(true);
			expect(isSensitive('fixture', key), key).toBe(true);
		}
		for (const key of ['key', 'releaseKey', 'tokenizer', 'cache.key', 'key_prefix', 'remote_tokenizer.url']) {
			expect(isSensitiveKey(key), key).toBe(false);
			expect(isSensitive('ordinary', key), key).toBe(false);
		}
	});

	it('examines values and nested data, retaining safe JSON text byte for byte', () => {
		for (const value of [
			'ordinary text',
			'Basic configuration',
			'Basic authentication',
			'ops@example.test',
			'host.example.test:5432',
			'2026-01-02T10:30:00Z',
			'identifier_0123456789abcdef',
			'{ "safe": [1, true, null] }\n',
			'HTTP 403 AccessDeniedException: Access is denied (PUT /a)',
		]) {
			expect(isSensitive(value), value).toBe(false);
			expect(redact(value), value).toBe(value);
		}
		expect(isSensitive({ nested: [{ arbitrary: token }] })).toBe(true);
		expect(isSensitive({ nested: [{ password: 42 }] })).toBe(true);
		expect(isSensitive(null)).toBe(false);
		expect(redact('{ "safe": 1, "password": "fixture" }')).toBe('{"safe":1,"password":"<redacted>"}');
	});

	it('copies config-item records, masking value, oldValue and newValue without changing key identity', () => {
		const source = {
			items: [{ key: 'db.password', value: 'fixture', oldValue: { a: 'old' }, newValue: ['new'] }],
			safe: 2n,
		};
		expect(redact(source)).toEqual({
			items: [{ key: 'db.password', value: marker, oldValue: marker, newValue: marker }],
			safe: 2n,
		});
		expect(source.items[0].oldValue).toEqual({ a: 'old' });
	});

	it.each([null, undefined, '', ' \t\r\n'])('keeps empty values insensitive: %j', (value) => {
		expect(isSensitive(value, 'password')).toBe(false);
		expect(redactValue(value, { key: 'password' })).toBe(value);
		const custom = createRedactor({ patterns: [/^\s*$/gu], knownSecrets: [' '], rules: [() => true] });
		expect(custom.isSensitive(value, 'ordinary')).toBe(false);
		expect(custom.redact(value)).toBe(value);
		const source = {
			password: value,
			nested: { token: value },
			items: [{ key: 'apiKey', value, oldValue: value, newValue: value }],
		};
		expect(isSensitive(source)).toBe(false);
		expect(redact(source)).toEqual(source);
		const json = JSON.stringify(source);
		expect(isSensitive(json)).toBe(false);
		expect(redact(json)).toBe(json);
		const map = new Map([['password', value]]);
		expect(isSensitive(map)).toBe(false);
		expect(redact(map)).toEqual(map);
	});

	it('examines non-empty values independently of field names without treating zero or false as absent', () => {
		const policy = createRedactor({ knownSecrets: ['fixture-private'], patterns: [/INTERNAL-\d+/gu] });
		for (const value of [
			token,
			'Bearer abc123',
			'app:fixture@tcp(db.example.test)/data',
			'fixture-private',
			'INTERNAL-42',
		]) {
			expect(policy.isSensitive(value, 'ordinary')).toBe(true);
			expect(policy.isSensitive({ ordinary: value })).toBe(true);
		}
		expect(policy.isSensitive('ordinary text', 'ordinary')).toBe(false);
		expect(policy.redact(token)).toBe('ghp_<redacted>');
		for (const value of [0, false]) {
			expect(isSensitive(value)).toBe(false);
			expect(isSensitive(value, 'password')).toBe(true);
			expect(redactValue(value, { key: 'password' })).toBe(marker);
		}
	});

	it('retains empty YAML fields, config-item values and web parameters without reporting them as sensitive', () => {
		const yaml =
			'password: null\ntoken: ""\nsecret: "  "\ncredentials:\nitems:\n  - key: password\n    value: null\n    oldValue: ""\n    newValue: "  "\n';
		expect(isSensitive(yaml)).toBe(false);
		expect(redactText(yaml)).toBe(yaml);
		const url = new URL('https://example.test/?password=&token&apiKey=%20%20');
		const headers = new Headers({ authorization: '' });
		const source = { url, params: url.searchParams, headers };
		expect(isSensitive(source)).toBe(false);
		const output = redact(source);
		expect(output.url.href).toBe(url.href);
		expect(output.params.toString()).toBe(url.searchParams.toString());
		expect(output.headers.get('authorization')).toBe('');
		expect(isSensitive('password=\napi_key=  \n')).toBe(false);
	});

	it.each([
		'https://example.test/?password=%20%20',
		'https://example.test/?password=&token&apiKey=%20%20',
		'https://example.test/?api_key=%09%0A&token=&safe=1',
		'https://example.test/?password=++&token',
	])('preserves empty URL query strings exactly like native URL values: %s', (value) => {
		expect(isSensitive(value)).toBe(false);
		expect(redact(value)).toBe(value);
		expect(redactMessage(value)).toBe(value);
		const url = new URL(value);
		expect(isSensitive(url)).toBe(false);
		expect(redact(url).href).toBe(url.href);
	});

	it('redacts URL query contents and surrounding assignments without consuming adjacent parameters', () => {
		expect(redactMessage('https://example.test/?password=&token&secret=fixture&safe=1')).toBe(
			'https://example.test/?password=&token&secret=<redacted>&safe=1',
		);
		expect(redactMessage('url=https://example.test/?password=%20&token password=fixture')).toBe(
			'url=https://example.test/?password=%20&token password=<redacted>',
		);
		expect(redactMessage('password=https://example.test/?token=&safe=1')).toBe('password=<redacted>');
		expect(redactMessage('https://example.test/?note=password%3Dfixture&token')).toBe(
			'https://example.test/?note=<redacted>&token',
		);
		expect(redactMessage('https://example.test/?note=Bearer%20abc123&token')).toBe(
			'https://example.test/?note=<redacted>&token',
		);
	});

	it.each([
		[
			'postgres://app:fixture@db.example.test:5432/data?password=query&count=1',
			'postgres://<redacted>@db.example.test:5432/data?password=<redacted>&count=1',
		],
		['app:p@ss:w0rd@tcp(db.example.test:3306)/data', 'app:<redacted>@tcp(db.example.test:3306)/data'],
		['https://api.example.test/?api%5Fkey=fixture&count=1', 'https://api.example.test/?api%5Fkey=<redacted>&count=1'],
		['Bearer abc123', 'Bearer <redacted>'],
		['Basic YTpi', 'Basic <redacted>'],
		[token, 'ghp_<redacted>'],
		['github_pat_abcdefghijklmnopqrstuvwxyz', 'github_pat_<redacted>'],
		['glpat-abcdefghijklmnopqrstuv', 'glpat-<redacted>'],
		['sk-proj-abcdefghijklmnopqrstuv', 'sk-proj-<redacted>'],
		['xoxb-fixture-test', 'xoxb-<redacted>'],
		['AKIAABCDEFGHIJKLMNOP', 'AKIA<redacted>'],
		['ASIAABCDEFGHIJKLMNOP', 'ASIA<redacted>'],
		['AIzaabcdefghijklmnopqrstuvwxyz012345', 'AIza<redacted>'],
		['eyJabcdefghijk.abcdefghijkl.abcdefghijkl', 'eyJ<redacted>'],
		['123456789:abcdefghijklmnopqrstuvwxyz0123456789', '123456789:<redacted>'],
		[
			'-----BEGIN PRIVATE KEY-----\nSYNTHETIC\n-----END PRIVATE KEY-----',
			'-----BEGIN PRIVATE KEY-----<redacted>-----END PRIVATE KEY-----',
		],
	])('detects credential shapes in any field: %s', (value, expected) => {
		expect(isSensitive(value)).toBe(true);
		expect(redact(value)).toBe(expected);
		expect(redact({ arbitrary: value })).toEqual({ arbitrary: expected });
	});

	it('keeps nested YAML valid, preserves CRLF and handles embedded JSON', () => {
		const source =
			'safe: 42\r\ncredentials:\r\n  password: fixture\r\nitems:\r\n  - key: apiKey\r\n    value: fixture\r\ncontent: \'{"password":"fixture","count":2}\'\r\n';
		const output = redactText(source, { marker: '***' });
		expect(parseDocument(output).errors).toEqual([]);
		expect(parseDocument(output).toJS()).toEqual({
			safe: 42,
			credentials: '***',
			items: [{ key: 'apiKey', value: '***' }],
			content: '{"password":"***","count":2}',
		});
		expect(output).not.toContain('fixture');
		expect(output.replaceAll('\r\n', '')).not.toMatch(/[\r\n]/u);
		expect(redactText(output, { marker: '***' })).toBe(output);
	});

	it('quotes arbitrary markers safely in YAML, even for value-based rules', () => {
		for (const replacement of ['***', 'hidden: "value"', 'hidden\nvalue', '$&']) {
			const output = redactText('password: fixture\nnote: known-fixture\n', {
				marker: replacement,
				knownSecrets: ['known-fixture'],
			});
			expect(parseDocument(output).errors, output).toEqual([]);
			expect(parseDocument(output).toJS()).toEqual({ password: replacement, note: replacement });
		}
	});

	it('masks sensitive YAML comments and ambiguous sensitive aliases without leaking their contents', () => {
		for (const source of [
			'safe: 1 # password=fixture\n',
			'# Bearer abc123\nsafe: 1\n',
			'safe: &shared fixture\npassword: *shared\n',
		]) {
			const output = redactText(source, { marker: '***' });
			expect(output).not.toContain('fixture');
			expect(output).not.toContain('abc123');
			expect(parseDocument(output).errors).toEqual([]);
			expect(isSensitive(source)).toBe(true);
		}
	});

	it.each([
		'password: fixture # Bearer abc123\n',
		'password: fixture # password=comment-fixture\n',
		'credentials:\n  nested: fixture # Bearer abc123\nsafe: 1\n',
		'credentials: { nested: fixture } # Bearer abc123\nsafe: 1\n',
		'privateGroup:\n  - fixture # Bearer abc123\nsafe: 1\n',
		'- private-rule-fixture # Bearer abc123\n',
		'- key: password\n  value: fixture # Bearer abc123\n',
		'safe: &shared fixture\ncredentials:\n  nested: *shared\n',
	])('checks comments and aliases even when an entire YAML node is replaced: %s', (source) => {
		const policy = createRedactor({
			marker: '***',
			rules: [(value, key) => key === 'privateGroup' || value === 'private-rule-fixture'],
		});
		expect(policy.redact(source)).toBe('"***"');
		expect(policy.isSensitive(source)).toBe(true);
	});

	it('retains harmless trailing comments when masking a sensitive scalar', () => {
		expect(redactText('password: fixture # ordinary note\n')).toBe('password: <redacted> # ordinary note\n');
	});

	it('keeps matching independent of the marker and covers repeated custom matches', () => {
		const empty = createRedactor({ marker: '' });
		expect(empty.redact('app:fixture@tcp(db.example.test)/data')).toBe('app:@tcp(db.example.test)/data');
		expect(empty.redact('password: fixture')).toBe('password: ""');
		expect(empty.isSensitive('password=fixture')).toBe(true);
		expect(createRedactor({ marker: 'abcdefghijklmnopqrstuv' }).isSensitive('sk-abcdefghijklmnopqrstuv')).toBe(true);
		expect(
			createRedactor({ patterns: [/FIXTURE/], knownSecrets: ['known', 'known-long'] }).redact(
				'FIXTURE FIXTURE known-long',
			),
		).toBe('<redacted> <redacted> <redacted>');
		expect(redactMessage('Error: password=fixture<redacted>')).toBe('Error: password=<redacted>');
		expect(redact('app:fixture<redacted>@tcp(db.example.test)/data')).toBe('app:<redacted>@tcp(db.example.test)/data');
	});

	it('keeps diagnostics line oriented and Apollo compatibility independent of global replacements', () => {
		const text =
			'rejected: HTTP 403 AccessDeniedException: Access is denied (PUT /a)\r\npassword=fixture\r\nsecond line';
		expect(redactMessage(text)).toBe(
			'rejected: HTTP 403 AccessDeniedException: Access is denied (PUT /a)\r\npassword=<redacted>\r\nsecond line',
		);
		expect(redactMessage('TypeError: password=fixture')).toBe('TypeError: password=<redacted>');
		const previous = setRedactor({ redact: <T>(value: T) => value, isSensitive: () => false });
		try {
			expect(redact({ password: 'fixture' })).toEqual({ password: 'fixture' });
			expect(redactApolloValue({ password: 'fixture' })).toEqual({ password: marker });
			expect(redactApolloMessage(text)).not.toContain('fixture');
		} finally {
			setRedactor(previous);
		}
	});

	it('honors explicit stateless helper bypass, marker and key hints', () => {
		const source = { password: 'fixture' };
		expect(redactValue(source, { redact: false })).toBe(source);
		expect(redactText('fixture', { key: 'password', marker: '***' })).toBe('***');
		expect(redactMessage('password=fixture', { redact: false })).toBe('password=fixture');
	});
});

describe('policy ownership', () => {
	it('snapshots custom keys, secrets and regexes and does not leak policy across calls', async () => {
		const knownSecrets = ['fixture-private'];
		const patterns = [/INTERNAL-\d+/gu];
		const sensitiveKeys = ['customField'];
		const a = createRedactor({ marker: 'A', knownSecrets, patterns, sensitiveKeys });
		knownSecrets[0] = 'changed';
		patterns[0].compile('changed', 'g');
		sensitiveKeys[0] = 'changed';
		const b = createRedactor({ marker: 'B', rules: [(value, key) => key === 'privateNote' || value === 17] });
		const data = { customField: 'hello', note: 'fixture-private INTERNAL-42', privateNote: 'hello', count: 17 };
		const outputs = await Promise.all([
			Promise.resolve().then(() => a.redact(data)),
			Promise.resolve().then(() => b.redact(data)),
		]);
		expect(outputs[0]).toEqual({ customField: 'A', note: 'A A', privateNote: 'hello', count: 17 });
		expect(outputs[1]).toEqual({
			customField: 'hello',
			note: 'fixture-private INTERNAL-42',
			privateNote: 'B',
			count: 'B',
		});
		expect(a.redact(data)).toEqual(outputs[0]);
		expect(b.isSensitive(17)).toBe(true);
		expect(a.isSensitive('fixture-private')).toBe(true);
		expect(createRedactor().isSensitive('fixture-private')).toBe(false);
	});

	it('delegates global helpers to the current singleton and supports reset/restore', () => {
		const original = getRedactor();
		const replacement: Redactor = {
			redact: <T>(_value: T) => 'replacement' as T,
			isSensitive: (_value, key) => key === 'custom',
		};
		expect(setRedactor(replacement)).toBe(original);
		try {
			expect(getRedactor()).toBe(replacement);
			expect(redact('ordinary')).toBe('replacement');
			expect(isSensitive('ordinary', 'custom')).toBe(true);
			expect(setRedactor()).toBe(replacement);
			expect(redact({ password: 'fixture' })).toEqual({ password: marker });
		} finally {
			setRedactor(original);
		}
		expect(getRedactor()).toBe(original);
	});
});

describe('safe structured traversal', () => {
	it('prevents serialization hooks from restoring original secrets after redaction', () => {
		const toJSON = vi.fn(() => ({ password: 'fixture-secret' }));
		const source = { password: 'fixture-secret', toJSON };
		const output = redact(source);
		expect(output.password).toBe(marker);
		expect(JSON.stringify(output)).toBe('{"password":"<redacted>"}');
		expect(toJSON).not.toHaveBeenCalled();
		expect(source.toJSON).toBe(toJSON);
		class JsonError extends Error {
			toJSON() {
				return { password: 'fixture-secret' };
			}
		}
		expect(JSON.stringify(redact(new JsonError('password=fixture-secret')))).not.toContain('fixture-secret');
		expect(redact({ toJSON: 'ordinary data', safe: true })).toEqual({ toJSON: 'ordinary data', safe: true });
	});

	it('does not mutate frozen inputs; preserves cycles and shared-reference topology', () => {
		const shared = Object.freeze({ password: 'fixture', safe: 1 });
		const source: { a: typeof shared; b: typeof shared; self?: unknown } = { a: shared, b: shared };
		source.self = source;
		Object.freeze(source);
		const output = redact(source);
		expect(output).not.toBe(source);
		expect(output.a).not.toBe(shared);
		expect(output.a.password).toBe(marker);
		expect(output.a).toBe(output.b);
		expect(output.self).toBe(output);
		expect(shared.password).toBe('fixture');
		expect(isSensitive(source)).toBe(true);
		const safe: { self?: unknown } = {};
		safe.self = safe;
		expect(isSensitive(safe)).toBe(false);
	});

	it('never calls getters or serializes objects globally; constructs unsafe property names safely', () => {
		let getterCalls = 0;
		const source = Object.create(null);
		Object.defineProperty(source, 'computed', {
			enumerable: true,
			get() {
				getterCalls++;
				throw new Error('getter');
			},
		});
		Object.defineProperty(source, '__proto__', { enumerable: true, value: { password: 'fixture' } });
		Object.defineProperty(source, 'constructor', { enumerable: true, value: { token: 'fixture' } });
		Object.defineProperty(source, 'toJSON', {
			enumerable: true,
			value: () => {
				throw new Error('serialize');
			},
		});
		const output = redact(source);
		expect(getterCalls).toBe(0);
		expect(Object.hasOwn(output, 'computed')).toBe(false);
		expect(Object.getPrototypeOf(output)).toBe(null);
		expect(output.__proto__).toEqual({ password: marker });
		expect(output.constructor).toEqual({ token: marker });
		expect(Object.prototype).not.toHaveProperty('password');
	});

	it('retains array holes/symbol data and treats date, regexp, bigint, binary and streams as opaque', () => {
		const symbol = Symbol('extra');
		const source = new Array(3);
		source[2] = { password: 'fixture' };
		Object.defineProperty(source, symbol, { value: { token: 'fixture' }, enumerable: true });
		const output = redact(source);
		expect(0 in output).toBe(false);
		expect(output.length).toBe(3);
		expect(Reflect.get(output, symbol)).toEqual({ token: marker });
		for (const value of [
			new Date('2026-01-01'),
			/ordinary/gu,
			new Uint8Array([1, 2]),
			new ArrayBuffer(2),
			new ReadableStream(),
			42n,
		]) {
			expect(redact(value)).toBe(value);
			expect(isSensitive(value)).toBe(false);
		}
	});

	it('redacts Map/Set entries without consuming or mutating the source', () => {
		const map = new Map<unknown, unknown>([
			['password', 'fixture'],
			['safe', { note: token }],
		]);
		map.set('self', map);
		const set = new Set<unknown>([token]);
		set.add(set);
		const output = redact({ map, set });
		expect(output.map.get('password')).toBe(marker);
		expect(output.map.get('safe')).toEqual({ note: 'ghp_<redacted>' });
		expect(output.map.get('self')).toBe(output.map);
		expect(output.set.has('ghp_<redacted>')).toBe(true);
		expect(output.set.has(output.set)).toBe(true);
		expect(map.get('password')).toBe('fixture');
		expect(set.has(token)).toBe(true);
	});

	it('copies Errors and recursively sanitizes causes while preserving diagnostic lines', () => {
		const cause = new Error('password=fixture\nnext line');
		const error = new TypeError('HTTP 400 rejected: Access is denied (PUT /a)', { cause });
		// Lazy native stack accessors are intentionally omitted; an own data stack is copied.
		Object.defineProperty(error, 'stack', {
			value: 'TypeError: password=fixture\n  at synthetic (https://example.test/test:1:1)',
			configurable: true,
		});
		Object.assign(error, { context: { token: 'fixture' } });
		const output = redact(error);
		expect(output).toBeInstanceOf(TypeError);
		expect(output.message).toBe(error.message);
		expect((output.cause as Error).message).toBe('password=<redacted>\nnext line');
		expect(output.stack).not.toContain('fixture');
		expect((output as typeof error & { context: unknown }).context).toEqual({ token: marker });
		expect(cause.message).toContain('fixture');
	});

	it('handles URL, URLSearchParams and Headers with their native interfaces', () => {
		const url = new URL('https://app:fixture@example.test/path?token=fixture&safe=1');
		const params = new URLSearchParams('password=first&password=second&safe=1');
		const headers = new Headers({ Authorization: 'Basic YTpi', 'X-Safe': 'ordinary', 'Set-Cookie': 'session=fixture' });
		const output = redact({ url, params, headers });
		expect(output.url).toBeInstanceOf(URL);
		expect(output.url.password).toBe('');
		expect(output.url.searchParams.get('token')).toBe(marker);
		expect(output.params.getAll('password')).toEqual([marker, marker]);
		expect(output.headers.get('authorization')).toBe(marker);
		expect(output.headers.get('set-cookie')).toBe(marker);
		expect(output.headers.get('x-safe')).toBe('ordinary');
		expect(url.password).toBe('fixture');
		expect(params.get('password')).toBe('first');
		expect(headers.get('authorization')).toBe('Basic YTpi');
		const safeUrl = new URL('https://example.test/path?query=a%20b&empty#plain');
		expect(redact(safeUrl).href).toBe(safeUrl.href);
		expect(isSensitive(safeUrl)).toBe(false);
	});

	it('bounds deep, wide and oversized text inputs and fails closed without leaking unchecked tails', () => {
		const limited = createRedactor({ maxDepth: 8, maxNodes: 100, maxTextLength: 128 });
		const deep: Record<string, unknown> = {};
		let cursor = deep;
		for (let index = 0; index < 10_000; index++) {
			cursor.next = {};
			cursor = cursor.next as typeof deep;
		}
		cursor.password = 'fixture';
		expect(() => limited.redact(deep)).not.toThrow();
		expect(limited.isSensitive(deep)).toBe(true);
		expect(JSON.stringify(limited.redact(deep))).not.toContain('fixture');
		const wide = Array.from({ length: 10_000 }, () => ({ ordinary: 'fixture' }));
		expect(limited.redact(wide)).toBe(marker);
		expect(limited.redact('x'.repeat(129))).toBe(marker);
		expect(limited.redact('a:\n' + '  '.repeat(1000) + 'password: fixture')).toBe(marker);
		expect(() => createRedactor({ maxNodes: 0 })).toThrow(RangeError);
		expect(() => createRedactor({ maxDepth: Infinity })).toThrow(RangeError);
		expect(() => createRedactor({ maxTextLength: 1.5 })).toThrow(RangeError);
	});
});
