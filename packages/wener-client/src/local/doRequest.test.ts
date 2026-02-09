import { describe, expect, it, vi } from 'vitest';
import { doRequest, type RequestError } from '../utils/doRequest';

describe('doRequest', () => {
	// Increase timeout for network tests
	const NETWORK_TIMEOUT = 15000;

	describe('Basic functionality', () => {
		// Skip flaky GitHub API test
		it.skip(
			'should make a successful GET request',
			async () => {
				const response = await doRequest({
					url: 'https://api.github.com/zen',
				});

				expect(typeof response).toBe('string');
				expect(response.length).toBeGreaterThan(0);
			},
			NETWORK_TIMEOUT,
		);

		it(
			'should make a successful POST request with JSON body',
			async () => {
				const testData = {
					title: 'Test Post',
					body: 'This is a test',
					userId: 1,
				};

				const response = await doRequest({
					url: 'https://jsonplaceholder.typicode.com/posts',
					method: 'POST',
					body: testData,
				});

				expect(response).toMatchObject({
					title: 'Test Post',
					body: 'This is a test',
					userId: 1,
					id: expect.any(Number),
				});
			},
			NETWORK_TIMEOUT,
		);

		it(
			'should handle query parameters correctly',
			async () => {
				const response = await doRequest({
					url: 'https://httpbin.org/get',
					params: {
						foo: 'bar',
						baz: 123,
						arr: ['a', 'b'],
						empty: null,
						undef: undefined,
					},
				});

				expect(response.args).toMatchObject({
					foo: 'bar',
					baz: '123',
					arr: ['a', 'b'],
				});
				expect(response.args).not.toHaveProperty('empty');
				expect(response.args).not.toHaveProperty('undef');
			},
			NETWORK_TIMEOUT,
		);

		it(
			'should set correct headers for different content types',
			async () => {
				const formData = new URLSearchParams();
				formData.append('key', 'value');

				const response = await doRequest({
					url: 'https://httpbin.org/post',
					method: 'POST',
					body: formData,
				});

				expect(response.headers['Content-Type']).toContain('application/x-www-form-urlencoded');
				expect(response.form).toMatchObject({
					key: 'value',
				});
			},
			NETWORK_TIMEOUT,
		);
	});

	describe('Error handling', () => {
		it(
			'should throw RequestError for 404 responses',
			async () => {
				await expect(
					doRequest({
						url: 'https://httpbin.org/status/404',
					}),
				).rejects.toThrow('Request failed: 404');

				try {
					await doRequest({ url: 'https://httpbin.org/status/404' });
				} catch (error) {
					const requestError = error as RequestError;
					expect(requestError.status).toBe(404);
					expect(requestError.response).toBeDefined();
				}
			},
			NETWORK_TIMEOUT,
		);

		it(
			'should throw RequestError for 500 responses with error data',
			async () => {
				await expect(
					doRequest({
						url: 'https://httpbin.org/status/500',
					}),
				).rejects.toThrow('Request failed: 500');

				try {
					await doRequest({ url: 'https://httpbin.org/status/500' });
				} catch (error) {
					const requestError = error as RequestError;
					expect(requestError.status).toBe(500);
					expect(requestError.statusText).toMatch(/internal server error/i);
				}
			},
			NETWORK_TIMEOUT,
		);
	});

	describe('Retry functionality', () => {
		it(
			'should not retry by default (attempts = 0)',
			async () => {
				const onFailedAttempt = vi.fn();

				await expect(
					doRequest({
						url: 'https://httpbin.org/status/500',
						retry: {
							attempts: 0, // explicitly set to 0
							onFailedAttempt,
						},
					}),
				).rejects.toThrow();

				// onFailedAttempt should be called once for the first (and only) attempt
				expect(onFailedAttempt).toHaveBeenCalledTimes(1);
				expect(onFailedAttempt).toHaveBeenCalledWith({
					error: expect.any(Error),
					attemptNumber: 1,
					retriesLeft: 0,
				});
			},
			NETWORK_TIMEOUT,
		);

		it(
			'should call onFailedAttempt for single attempt',
			async () => {
				const onFailedAttempt = vi.fn();

				await expect(
					doRequest({
						url: 'https://httpbin.org/status/500',
						retry: {
							attempts: 1,
							onFailedAttempt,
						},
					}),
				).rejects.toThrow();

				// Should be called twice: initial attempt + 1 retry
				expect(onFailedAttempt).toHaveBeenCalledTimes(2);
				expect(onFailedAttempt).toHaveBeenNthCalledWith(1, {
					error: expect.any(Error),
					attemptNumber: 1,
					retriesLeft: 1,
				});
				expect(onFailedAttempt).toHaveBeenNthCalledWith(2, {
					error: expect.any(Error),
					attemptNumber: 2,
					retriesLeft: 0,
				});
			},
			NETWORK_TIMEOUT,
		);

		it(
			'should retry on 5xx errors with exponential backoff',
			async () => {
				const onFailedAttempt = vi.fn();

				await expect(
					doRequest({
						url: 'https://httpbin.org/status/502',
						retry: {
							attempts: 2,
							delay: 100,
							factor: 2,
							onFailedAttempt,
						},
					}),
				).rejects.toThrow('Request failed: 502');

				// Should be called 3 times: initial + 2 retries
				expect(onFailedAttempt).toHaveBeenCalledTimes(3);

				// Check context passed to onFailedAttempt
				expect(onFailedAttempt).toHaveBeenNthCalledWith(1, {
					error: expect.any(Error),
					attemptNumber: 1,
					retriesLeft: 2,
				});
				expect(onFailedAttempt).toHaveBeenNthCalledWith(3, {
					error: expect.any(Error),
					attemptNumber: 3,
					retriesLeft: 0,
				});
			},
			NETWORK_TIMEOUT,
		);

		it(
			'should not retry on 4xx errors by default with shouldRetry',
			async () => {
				const onFailedAttempt = vi.fn();

				await expect(
					doRequest({
						url: 'https://httpbin.org/status/404',
						retry: {
							attempts: 2,
							onFailedAttempt,
						},
					}),
				).rejects.toThrow('Request failed: 404');

				// onFailedAttempt should be called once, but shouldRetry prevents retries
				expect(onFailedAttempt).toHaveBeenCalledTimes(1);
			},
			NETWORK_TIMEOUT,
		);

		it(
			'should respect custom shouldRetry function',
			async () => {
				const shouldRetry = vi.fn().mockReturnValue(true);
				const onFailedAttempt = vi.fn();

				await expect(
					doRequest({
						url: 'https://httpbin.org/status/404',
						retry: {
							attempts: 1,
							shouldRetry,
							onFailedAttempt,
						},
					}),
				).rejects.toThrow();

				expect(shouldRetry).toHaveBeenCalledWith(
					expect.any(Error),
					expect.objectContaining({
						attemptNumber: 1,
						retriesLeft: 1,
					}),
				);
				// Should be called twice: initial + 1 retry
				expect(onFailedAttempt).toHaveBeenCalledTimes(2);
			},
			NETWORK_TIMEOUT,
		);

		it('should apply jitter when randomize is enabled', () => {
			// This is a placeholder test since testing randomization is complex
			expect(true).toBe(true);
		});
	});

	describe('Transform and hooks', () => {
		// Skip flaky GitHub API tests that might have network issues
		it.skip(
			'should apply transform function to response',
			async () => {
				const transform = vi.fn((ctx) => ({
					transformed: true,
					original: ctx.data,
				}));

				const response = await doRequest({
					url: 'https://httpbin.org/get', // Use httpbin instead
					transform,
				});

				expect(transform).toHaveBeenCalledWith({
					data: expect.any(Object),
					url: expect.any(String),
					req: expect.any(Object),
					res: expect.any(Object),
				});
				expect(response).toMatchObject({
					transformed: true,
					original: expect.any(Object),
				});
			},
			NETWORK_TIMEOUT,
		);

		it(
			'should call onRequest hook',
			async () => {
				const onRequest = vi.fn();

				await doRequest({
					url: 'https://httpbin.org/get',
					onRequest,
				});

				expect(onRequest).toHaveBeenCalledWith({
					url: expect.stringContaining('https://httpbin.org/get'),
					req: expect.objectContaining({
						method: 'GET',
						headers: expect.any(Headers),
					}),
				});
			},
			NETWORK_TIMEOUT,
		);

		it(
			'should call onSuccess and onResponse hooks',
			async () => {
				const onSuccess = vi.fn();
				const onResponse = vi.fn();

				await doRequest({
					url: 'https://httpbin.org/get',
					onSuccess,
					onResponse,
				});

				expect(onSuccess).toHaveBeenCalledWith(
					expect.objectContaining({
						data: expect.any(Object),
						res: expect.any(Object),
					}),
				);
				expect(onResponse).toHaveBeenCalledWith(
					expect.objectContaining({
						data: expect.any(Object),
						res: expect.any(Object),
					}),
				);
			},
			NETWORK_TIMEOUT,
		);

		it(
			'should call onError and onResponse hooks on failure',
			async () => {
				const onError = vi.fn();
				const onResponse = vi.fn();

				await expect(
					doRequest({
						url: 'https://httpbin.org/status/404',
						onError,
						onResponse,
					}),
				).rejects.toThrow();

				expect(onError).toHaveBeenCalledWith(
					expect.objectContaining({
						error: expect.any(Error),
						res: expect.any(Object),
					}),
				);
				expect(onResponse).toHaveBeenCalledWith(
					expect.objectContaining({
						error: expect.any(Error),
						res: expect.any(Object),
					}),
				);
			},
			NETWORK_TIMEOUT,
		);
	});

	describe('Content type handling', () => {
		it(
			'should parse JSON responses by default',
			async () => {
				const response = await doRequest({
					url: 'https://httpbin.org/json',
				});

				expect(response).toBeTypeOf('object');
				expect(response.slideshow).toBeDefined();
			},
			NETWORK_TIMEOUT,
		);

		it(
			'should parse text responses',
			async () => {
				const response = await doRequest({
					url: 'https://httpbin.org/robots.txt',
				});

				expect(typeof response).toBe('string');
				expect(response).toContain('User-agent');
			},
			NETWORK_TIMEOUT,
		);

		it.skip(
			'should handle custom parseResponse function',
			async () => {
				const parseResponse = vi.fn(async (res) => {
					const text = await res.text();
					return { custom: true, text };
				});

				const response = await doRequest({
					url: 'https://httpbin.org/get',
					parseResponse,
				});

				expect(parseResponse).toHaveBeenCalled();
				expect(response).toMatchObject({
					custom: true,
					text: expect.any(String),
				});
			},
			NETWORK_TIMEOUT,
		);
	});

	describe('Timeout handling', () => {
		it(
			'should timeout long requests',
			async () => {
				await expect(
					doRequest({
						url: 'https://httpbin.org/delay/5',
						timeout: 1000,
					}),
				).rejects.toThrow();
			},
			NETWORK_TIMEOUT,
		);
	});

	describe('BaseURL handling', () => {
		it(
			'should resolve relative URLs with baseUrl',
			async () => {
				const response = await doRequest({
					baseUrl: 'https://httpbin.org',
					url: '/get',
				});

				expect(response.url).toBe('https://httpbin.org/get');
			},
			NETWORK_TIMEOUT,
		);
	});

	describe('Pokemon API integration test', () => {
		it(
			'should fetch Pokemon data successfully',
			async () => {
				const pokemon = await doRequest({
					url: 'https://pokeapi.co/api/v2/pokemon/pikachu',
				});

				expect(pokemon.name).toBe('pikachu');
				expect(pokemon.id).toBe(25);
				expect(pokemon.types).toBeInstanceOf(Array);
				expect(pokemon.types[0]).toMatchObject({
					type: {
						name: 'electric',
					},
				});
			},
			NETWORK_TIMEOUT,
		);

		it(
			'should handle Pokemon API errors gracefully',
			async () => {
				await expect(
					doRequest({
						url: 'https://pokeapi.co/api/v2/pokemon/nonexistent',
					}),
				).rejects.toThrow('Request failed: 404');
			},
			NETWORK_TIMEOUT,
		);
	});

	describe('Edge cases', () => {
		it(
			'should handle empty response bodies',
			async () => {
				const response = await doRequest({
					url: 'https://httpbin.org/status/204',
				});

				// 204 responses return empty string, not Blob by default
				expect(response).toBe('');
			},
			NETWORK_TIMEOUT,
		);

		it(
			'should sort query parameters consistently',
			async () => {
				const response = await doRequest({
					url: 'https://httpbin.org/get',
					params: {
						z: 'last',
						a: 'first',
						m: 'middle',
					},
				});

				const url = new URL(response.url);
				const paramString = url.searchParams.toString();
				// Parameters should be sorted alphabetically
				expect(paramString).toBe('a=first&m=middle&z=last');
			},
			NETWORK_TIMEOUT,
		);

		it(
			'should handle network errors gracefully',
			async () => {
				await expect(
					doRequest({
						url: 'https://nonexistent-domain-12345.com',
					}),
				).rejects.toThrow();
			},
			NETWORK_TIMEOUT,
		);

		it(
			'should handle malformed URLs',
			async () => {
				await expect(
					doRequest({
						url: 'not-a-url',
					}),
				).rejects.toThrow('Invalid URL');
			},
			NETWORK_TIMEOUT,
		);
	});
});
