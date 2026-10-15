import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { type AiRouterFetch, createAiRouter } from '../../src/ai/router';
import { makeTestPng } from './native-fixtures';

const nativePaths = [
	'/v1/embeddings',
	'/v1/rerank',
	'/v1/images/generations',
	'/v1/images/edits',
	'/v1/audio/speech',
	'/v1/audio/transcriptions',
	'/v1/systemone',
];

function router(fetch: AiRouterFetch) {
	return createAiRouter({
		resolve: async (ctx) => ({ api: ctx.endpoint.type, baseURL: 'https://upstream.test', model: 'native-model' }),
		fetch,
	});
}

function request(path: string, body: Record<string, unknown> | FormData): Request {
	return new Request(`http://router.test${path}`, {
		method: 'POST',
		headers: body instanceof FormData ? undefined : { 'content-type': 'application/json' },
		body: body instanceof FormData ? body : JSON.stringify(body),
	});
}

describe('ai/router native offline fidelity', () => {
	test.each([
		[
			'/v1/embeddings',
			{ input: { prompt_string: 'image <__media__>', multimodal_data: ['base64-payload'] }, encoding_format: 'float' },
		],
		['/v1/rerank', { query: 'France', documents: ['Paris', 'Tokyo'], top_n: 2 }],
		['/v1/images/generations', { prompt: '红色方块', n: 1, output_format: 'png' }],
		['/v1/audio/speech', { input: '你好，世界', response_format: 'wav' }],
		['/v1/audio/transcriptions', { audio: '/server/synthetic.wav', language: 'zh' }],
		[
			'/v1/systemone',
			{ state: { invoice: 1250 }, questions: { large: { type: 'noul', instructions: 'Above 1000?' } } },
		],
	] as const)('%s preserves JSON extensions and response bytes', async (path, fields) => {
		const body = { model: 'client-alias', ...fields, vendor_extension: { nested: [null, false, 0, '中文'] } };
		const wireResponse = ' {"vendor_output":[1,null,false],"message":"原样返回"}\n';
		let calls = 0;
		const app = router(async (input, init) => {
			calls++;
			const upstream = new Request(input, init);
			assert.equal(upstream.url, `https://upstream.test${path}`);
			assert.equal(upstream.method, 'POST');
			assert.deepEqual(await upstream.json(), { ...body, model: 'native-model' });
			return new Response(wireResponse, {
				status: 201,
				headers: { 'content-type': 'application/json', 'x-native-response': 'kept' },
			});
		});
		const response = await app.fetch(request(path, body));
		assert.equal(calls, 1);
		assert.equal(response.status, 201);
		assert.equal(response.headers.get('x-native-response'), 'kept');
		assert.equal(response.headers.get('content-type'), 'application/json');
		assert.equal(await response.text(), wireResponse);
	});

	test.each(['/v1/images/edits', '/v1/audio/transcriptions'])(
		'%s preserves multipart files, repeated fields and names',
		async (path) => {
			const bytes = path.includes('images') ? makeTestPng() : Buffer.from([82, 73, 70, 70, 0, 255, 13, 10]);
			const fileField = path.includes('images') ? 'image[]' : 'file';
			const mime = path.includes('images') ? 'image/png' : 'audio/wav';
			const name = path.includes('images') ? 'square.png' : 'synthetic.wav';
			const form = new FormData();
			form.set('model', 'client-alias');
			form.set('prompt', '保留空格 与 Unicode');
			form.append(fileField, new Blob([new Uint8Array(bytes)], { type: mime }), name);
			form.append(fileField, new Blob([new Uint8Array(bytes)], { type: mime }), `second-${name}`);
			form.append('vendor[]', 'first');
			form.append('vendor[]', 'second');
			let calls = 0;
			const app = router(async (input, init) => {
				calls++;
				const upstream = new Request(input, init);
				assert.equal(new URL(upstream.url).pathname, path);
				assert.match(upstream.headers.get('content-type') ?? '', /^multipart\/form-data; boundary=/);
				const received = await upstream.formData();
				assert.equal(received.get('model'), 'native-model');
				assert.equal(received.get('prompt'), form.get('prompt'));
				assert.deepEqual(received.getAll('vendor[]'), ['first', 'second']);
				const files = received.getAll(fileField);
				assert.equal(files.length, 2);
				for (const [index, file] of files.entries()) {
					assert(file instanceof File);
					assert.equal(file.name, index === 0 ? name : `second-${name}`);
					assert.equal(file.type, mime);
					assert.deepEqual(Buffer.from(await file.arrayBuffer()), bytes);
				}
				return Response.json({ text: '原生 multipart', data: [{ b64_json: 'opaque-output' }] });
			});
			const response = await app.fetch(request(path, form));
			assert.equal(calls, 1);
			assert.equal(response.status, 200);
			assert.deepEqual(await response.json(), { text: '原生 multipart', data: [{ b64_json: 'opaque-output' }] });
		},
	);

	test('audio speech forwards binary chunks before upstream finishes', async () => {
		const first = new Uint8Array([82, 73, 70, 70, 0, 255]);
		const second = new Uint8Array([13, 10, 0, 128, 42]);
		let producer!: ReadableStreamDefaultController<Uint8Array>;
		const stream = new ReadableStream<Uint8Array>({
			start(controller) {
				producer = controller;
				controller.enqueue(first);
			},
		});
		const app = router(
			async () => new Response(stream, { headers: { 'content-type': 'audio/wav', 'x-native-audio': 'yes' } }),
		);
		const response = await app.fetch(request('/v1/audio/speech', { model: 'client-alias', input: 'hello' }));
		assert.equal(response.headers.get('content-type'), 'audio/wav');
		assert.equal(response.headers.get('x-native-audio'), 'yes');
		assert(response.body);
		const reader = response.body.getReader();
		try {
			assert.deepEqual(await reader.read(), { value: first, done: false });
			producer.enqueue(second);
			producer.close();
			assert.deepEqual(await reader.read(), { value: second, done: false });
			assert.equal((await reader.read()).done, true);
		} finally {
			await reader.cancel();
		}
	});

	test.each(nativePaths)('%s preserves native error status, headers and raw body', async (path) => {
		const rawError = '{ "error": { "type":"model_busy", "message":"模型繁忙", "vendor_code":73 } }\n';
		const app = router(
			async () =>
				new Response(rawError, {
					status: 429,
					headers: { 'content-type': 'application/json', 'retry-after': '17', 'x-native-error': 'busy' },
				}),
		);
		const response = await app.fetch(request(path, { model: 'client-alias', vendor_input: 'unchanged' }));
		assert.equal(response.status, 429);
		assert.equal(response.headers.get('retry-after'), '17');
		assert.equal(response.headers.get('x-native-error'), 'busy');
		assert.equal(response.headers.get('content-type'), 'application/json');
		assert.equal(await response.text(), rawError);
	});
});
