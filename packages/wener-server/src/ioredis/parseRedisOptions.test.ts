import { describe, expect, test } from 'vite-plus/test';
import { parseRedisOptions } from './parseRedisOptions';

describe('parseRedisOptions', () => {
	test('uses the default Redis port when the URL omits it', () => {
		expect(parseRedisOptions('redis://cache/4')).toMatchObject({
			host: 'cache',
			port: 6379,
			db: 4,
		});
	});

	test('preserves an explicit URL port', () => {
		expect(parseRedisOptions('redis://cache:6380/4')).toMatchObject({
			host: 'cache',
			port: 6380,
			db: 4,
		});
	});

	test('reads username and password from the URL', () => {
		expect(parseRedisOptions('redis://url-user:url-password@cache/2')).toMatchObject({
			username: 'url-user',
			password: 'url-password',
			db: 2,
		});
	});

	test('keeps explicit credentials over URL credentials', () => {
		expect(
			parseRedisOptions({
				url: 'redis://url-user:url-password@cache/2',
				username: 'configured-user',
				password: 'configured-password',
			}),
		).toMatchObject({
			username: 'configured-user',
			password: 'configured-password',
		});
	});

	test('enables DNS TLS SNI for rediss URLs', () => {
		expect(parseRedisOptions('rediss://cache.example.com/1')).toMatchObject({
			tls: { servername: 'cache.example.com' },
		});
	});

	test('does not enable TLS SNI for IP rediss URLs', () => {
		expect(parseRedisOptions('rediss://127.0.0.1/1')).toMatchObject({
			tls: { servername: undefined },
		});
	});

	test('uses an explicit TLS SNI override', () => {
		expect(parseRedisOptions('rediss://127.0.0.1/1?sni=cache.example.com')).toMatchObject({
			tls: { servername: 'cache.example.com' },
		});
	});
});
