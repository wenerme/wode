import { describe, expect, it } from 'vitest';
import { parseDocument } from 'yaml';
import { isApolloSensitiveKey, redactApolloMessage, redactApolloText, redactApolloValue } from './redactor';

const m = { marker: '***' };

describe('Apollo credential redaction', () => {
	it('treats dsn/passphrase/cookie and compound *_key names as sensitive, but not a bare key', () => {
		for (const key of [
			'data.database.dsn',
			'readDsn',
			'passphrase',
			'set_cookie',
			'api_key',
			'appKey',
			'secret.key',
			'jwt_key',
			'llm.sk',
		])
			expect(isApolloSensitiveKey(key), key).toBe(true);
		for (const key of ['key', 'cache.key', 'key_prefix', 'releaseKey', 'tokenizer', 'remote_tokenizer.url'])
			expect(isApolloSensitiveKey(key), key).toBe(false);
	});

	it('masks DSN userinfo, token prefixes and PEM keys under any key name', () => {
		expect(redactApolloText('replica: app:p@ss:w0rd@tcp(db.example.test:3306)/db?x=1', m)).toBe(
			'replica: app:***@tcp(db.example.test:3306)/db?x=1',
		);
		expect(redactApolloText('url: postgres://u:pw@db:5432/x', m)).toBe('url: postgres://***@db:5432/x');
		expect(redactApolloText('note: use sk-proj-abcdefghijklmnopqrstuv now', m)).toBe('note: use sk-proj-*** now');
		expect(redactApolloText('h: Bearer abcdefghijklmnopqrstuvwxyz', m)).toBe('h: Bearer ***');
		expect(redactApolloText('id: AKIAABCDEFGHIJKLMNOP', m)).toBe('id: AKIA***');
		expect(redactApolloValue({ x: 'ghp_abcdefghijklmnopqrstuvwxyz0123' }, m)).toEqual({ x: 'ghp_***' });
		expect(redactApolloText('-----BEGIN PRIVATE KEY-----\nMIIEv\n-----END PRIVATE KEY-----', m)).toBe(
			'-----BEGIN PRIVATE KEY-----***-----END PRIVATE KEY-----',
		);
	});

	it('leaves ordinary values alone', () => {
		for (const text of ['time: 10:30:00', 'addr: user@host:22', 'mail: ops@example.com', 'cache.key=user-profile'])
			expect(redactApolloText(text, m)).toBe(text);
	});

	it('keeps redacted YAML valid and idempotent (block keys are not replaced)', () => {
		const source = 'a:\n  credentials:\n    user: app\n    password: x\n  dsn: "u:p@tcp(h)/d"\nb: 1\n';
		const once = redactApolloText(source, m);
		// The whole sensitive block is replaced in place; the key line itself is never rewritten.
		expect(once).toBe('a:\n  credentials:\n    "***"\n  dsn: "***"\nb: 1\n');
		expect(parseDocument(once).errors).toEqual([]);
		expect(redactApolloText(once, m)).toBe(once);
	});

	it('redacts free-text messages without collapsing them', () => {
		expect(redactApolloMessage('HTTP 400 bad dsn=app:pw@tcp(h)/x token sk-abcdefghijklmnopqrstu', m)).toBe(
			'HTTP 400 bad dsn=***',
		);
		expect(redactApolloMessage('HTTP 400 near app:pw@tcp(h)/x and sk-abcdefghijklmnopqrstu', m)).toBe(
			'HTTP 400 near app:***@tcp(h)/x and sk-***',
		);
		expect(redactApolloMessage('rejected: HTTP 403 AccessDeniedException: Access is denied (PUT /a)', m)).toBe(
			'rejected: HTTP 403 AccessDeniedException: Access is denied (PUT /a)',
		);
	});
});
