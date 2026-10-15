import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, test } from 'vitest';
import { createAiRouter } from '../../src/ai/router';
import { SystemOneDecisionResponseSchema } from '../../src/api/systemone-decision/schema/SystemOneDecisionSchema';
import {
	assertEmbeddings,
	assertPng,
	assertWav,
	errorSummary,
	type JsonObject,
	makeTestPng,
	object,
} from './native-fixtures';

const env = process.env;
const baseURL = env.TESTING_NATIVE_BASE_URL?.replace(/\/+$/, '');
const apiKey = env.TESTING_NATIVE_API_KEY;
const models = {
	embedding: env.TESTING_EMBEDDING_MODEL,
	rerank: env.TESTING_RERANK_MODEL,
	image: env.TESTING_IMAGE_MODEL,
	tts: env.TESTING_TTS_MODEL,
	stt: env.TESTING_STT_MODEL,
	decision: env.TESTING_DECISION_MODEL,
};
const timeout = 300_000;
const spokenText = '你好，欢迎使用语音测试。Hello, this is a speech test.';
const localImage = makeTestPng();

function configured(model: string | undefined): boolean {
	return Boolean(baseURL && model);
}

async function request(path: string, model: string | undefined, body: JsonObject | FormData): Promise<Response> {
	assert(baseURL && model, 'Native live test requires TESTING_NATIVE_BASE_URL and the scenario model');
	const app = createAiRouter({
		resolve: async (ctx) => ({
			api: ctx.endpoint.type,
			baseURL,
			model,
			headers: apiKey ? { authorization: `Bearer ${apiKey}` } : undefined,
		}),
	});
	const headers = new Headers();
	if (apiKey) headers.set('authorization', `Bearer ${apiKey}`);
	if (!(body instanceof FormData)) headers.set('content-type', 'application/json');
	const response = await app.fetch(
		new Request(`http://router.test${path}`, {
			method: 'POST',
			headers,
			body: body instanceof FormData ? body : JSON.stringify({ ...body, model }),
			signal: AbortSignal.timeout(timeout - 5_000),
		}),
	);
	if (!response.ok) {
		throw new Error(`${path} (${model}): HTTP ${response.status}: ${errorSummary(await response.text(), apiKey)}`);
	}
	return response;
}

async function json(path: string, model: string | undefined, body: JsonObject | FormData): Promise<unknown> {
	return (await request(path, model, body)).json();
}

async function imageResponse(path: string, body: JsonObject | FormData): Promise<Buffer> {
	const data = object(await json(path, models.image, body)).data;
	assert(Array.isArray(data) && data.length === 1, 'Expected exactly one generated image');
	const base64 = object(data[0]).b64_json;
	assert(typeof base64 === 'string' && base64.length > 0, 'Expected b64_json image');
	const bytes = Buffer.from(base64, 'base64');
	const dimensions = assertPng(bytes);
	assert.equal(dimensions.width, 256);
	assert.equal(dimensions.height, 256);
	console.info(`[native live] ${path}: PNG ${dimensions.width}x${dimensions.height}, ${bytes.length} bytes`);
	return bytes;
}

let speech: Promise<Buffer> | undefined;
function synthesize(): Promise<Buffer> {
	return (speech ??= (async () => {
		assert(models.tts, 'STT requires TESTING_TTS_MODEL or TESTING_STT_AUDIO_FILE');
		const response = await request('/v1/audio/speech', models.tts, {
			input: spokenText,
			response_format: 'wav',
			options: { retry_badcase: false },
		});
		assert.match(response.headers.get('content-type') ?? '', /audio\/(?:wav|x-wav|wave)/);
		const bytes = Buffer.from(await response.arrayBuffer());
		const audio = assertWav(bytes);
		console.info(`[native live] TTS: WAV ${audio.sampleRate} Hz, ${audio.dataBytes} audio bytes`);
		return bytes;
	})());
}

// 所有推理均经 app.fetch；仅 /props 是直接读取模型元数据，不作为推理验收。
// 上游 media_marker 每次启动可能变化，不能把本机 llama.cpp 的固定 marker 写死。
async function imageEmbeddingInput(): Promise<JsonObject> {
	assert(baseURL && models.embedding);
	let marker = env.TESTING_EMBEDDING_MEDIA_MARKER;
	if (!marker) {
		const propsURL = new URL(`${baseURL.replace(/\/v1$/, '')}/props`);
		propsURL.searchParams.set('model', models.embedding);
		const response = await fetch(propsURL, {
			headers: apiKey ? { authorization: `Bearer ${apiKey}` } : {},
			signal: AbortSignal.timeout(timeout - 5_000),
		});
		assert(response.ok, `/props metadata returned HTTP ${response.status}`);
		const props = object(await response.json());
		assert.equal(object(props.modalities).vision, true, 'Embedding model must support vision');
		assert(typeof props.media_marker === 'string' && props.media_marker.length > 0, 'Missing media_marker');
		marker = props.media_marker;
	}
	return { prompt_string: `Represent this image: ${marker}`, multimodal_data: [localImage.toString('base64')] };
}

describe('ai/router native live (requires TESTING_* configuration)', { concurrent: false }, () => {
	test.skipIf(!configured(models.embedding))(
		'embedding: text batch yields finite vectors of equal dimension',
		async () => {
			const vectors = assertEmbeddings(
				await json('/v1/embeddings', models.embedding, {
					input: ['A red square on a white background.', '蓝色的海洋与天空。'],
					encoding_format: 'float',
				}),
				2,
			);
			assert.notDeepEqual(vectors[0], vectors[1]);
			console.info(`[native live] text embedding: 2 x ${vectors[0].length}`);
		},
		timeout,
	);

	test.skipIf(!configured(models.embedding))(
		'embedding: local PNG through llama multimodal input',
		async () => {
			const vectors = assertEmbeddings(
				await json('/v1/embeddings', models.embedding, {
					input: await imageEmbeddingInput(),
					encoding_format: 'float',
				}),
				1,
			);
			console.info(`[native live] image embedding: 1 x ${vectors[0].length}`);
		},
		timeout,
	);

	test.skipIf(!configured(models.rerank))(
		'rerank: indices, finite scores and relevant first document',
		async () => {
			const result = object(
				await json('/v1/rerank', models.rerank, {
					query: 'What is the capital city of France?',
					documents: [
						'Paris is the capital city of France.',
						'Bananas grow in tropical climates.',
						'A violin has four strings.',
					],
					top_n: 3,
				}),
			);
			assert(Array.isArray(result.results));
			assert.equal(result.results.length, 3);
			const ranks = result.results.map(object);
			assert.deepEqual(ranks.map((rank) => rank.index).sort(), [0, 1, 2]);
			for (const rank of ranks)
				assert(typeof rank.relevance_score === 'number' && Number.isFinite(rank.relevance_score));
			const ordered = [...ranks].sort((a, b) => Number(b.relevance_score) - Number(a.relevance_score));
			assert.equal(ordered[0].index, 0);
			assert(Number(ordered[0].relevance_score) > Number(ordered[1].relevance_score));
			console.info(
				'[native live] rerank:',
				ranks.map(({ index, relevance_score }) => ({ index, relevance_score })),
			);
		},
		timeout,
	);

	test.skipIf(!configured(models.image))(
		'image generation: decodable PNG',
		async () => {
			await imageResponse('/v1/images/generations', {
				prompt: 'A simple red square on a white background, flat illustration.',
				n: 1,
				size: '256x256',
				output_format: 'png',
				response_format: 'b64_json',
			});
		},
		timeout,
	);

	test.skipIf(!configured(models.image))(
		'image edit: multipart local PNG produces a different valid PNG',
		async () => {
			const form = new FormData();
			form.set('model', models.image!);
			form.set('prompt', 'Change the red square to a blue square. Keep the white background.');
			form.set('image[]', new Blob([new Uint8Array(localImage)], { type: 'image/png' }), 'red-square.png');
			form.set('n', '1');
			form.set('size', '256x256');
			form.set('output_format', 'png');
			assert(!(await imageResponse('/v1/images/edits', form)).equals(localImage), 'Edit must not just echo the upload');
		},
		timeout,
	);

	test.skipIf(!configured(models.tts))(
		'TTS: bilingual synthetic speech as WAV',
		async () => {
			await synthesize();
		},
		timeout,
	);

	test.skipIf(!configured(models.stt))(
		'STT: multipart synthetic WAV yields nonempty transcript',
		async () => {
			const bytes = env.TESTING_STT_AUDIO_FILE ? await readFile(env.TESTING_STT_AUDIO_FILE) : await synthesize();
			assertWav(bytes);
			const form = new FormData();
			form.set('model', models.stt!);
			form.set('file', new Blob([new Uint8Array(bytes)], { type: 'audio/wav' }), 'synthetic-speech.wav');
			form.set('response_format', 'json');
			const result = object(await json('/v1/audio/transcriptions', models.stt, form));
			assert(typeof result.text === 'string' && result.text.trim().length > 0, 'STT returned no recognized text');
			console.info(`[native live] STT: recognized ${result.text.trim().length} characters`);
		},
		timeout,
	);

	test.skipIf(!configured(models.decision))(
		'decision: SystemOne choice and noul answers',
		async () => {
			const result = SystemOneDecisionResponseSchema.parse(
				await json('/v1/systemone', models.decision, {
					state: { invoice: { total: 1250, currency: 'USD', status: 'overdue' } },
					questions: {
						status: {
							type: 'choice',
							instructions: 'What is the invoice status?',
							criteria: { paid: 'Already paid.', overdue: 'Past due.', draft: 'Not sent.' },
						},
						large: { type: 'noul', instructions: 'Is the invoice total greater than 1000 USD?' },
					},
				}),
			);
			assert.equal(result.answers.status?.type, 'choice');
			const status = result.answers.status;
			assert(status.type === 'choice');
			assert.equal(status.choice, 'overdue');
			assert.deepEqual(Object.keys(status.probabilities).sort(), ['draft', 'overdue', 'paid']);
			for (const probability of Object.values(status.probabilities)) assert(probability >= 0 && probability <= 1);
			assert(
				Math.abs(Object.values(status.probabilities).reduce((sum, probability) => sum + probability, 0) - 1) < 0.01,
			);
			const large = result.answers.large;
			assert(large?.type === 'noul');
			assert(large.noul > 0.5 && large.noul <= 1);
			console.info('[native live] SystemOne: overdue, total > 1000');
		},
		timeout,
	);
});
