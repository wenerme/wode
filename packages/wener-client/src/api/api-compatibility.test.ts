import {
	AnthropicMessageBatchResultSchema,
	AnthropicMessagesBatchesCreateRequestSchema,
	AnthropicMessagesRequestSchema,
	AnthropicMessagesResponseSchema,
	AnthropicMessagesStreamEventSchema,
	OpenAIAudioSpeechRequestSchema,
	OpenAIAudioSpeechResponseSchema,
	OpenAIAudioTranscriptionsRequestSchema,
	OpenAIAudioTranscriptionsResponseSchema,
	OpenAIBatchesCreateRequestSchema,
	OpenAIBatchesListResponseSchema,
	OpenAIBatchResponseLineSchema,
	OpenAIChatCompletionsChunkSchema,
	OpenAIChatCompletionsRequestSchema,
	OpenAIImageEditsResponseSchema,
	OpenAIImageGenerationsResponseSchema,
	OpenAIResponsesCompactRequestSchema,
	OpenAIResponsesCompactResponseSchema,
	OpenAIResponsesRequestSchema,
} from '@wener/client/api';
import { SDAPITxt2ImgRequestSchema } from '@wener/client/api/sdapi-txt2img/schema';
import { describe, expect, test } from 'vitest';

const message = {
	id: 'msg-compatible',
	type: 'message',
	role: 'assistant',
	model: 'local/assistant',
	content: [{ type: 'text', text: 'hello' }],
	stop_reason: 'end_turn',
	stop_sequence: null,
	usage: { input_tokens: 4, output_tokens: 2 },
};

describe('公开 API 包入口与兼容服务载荷', () => {
	test('根入口与嵌套 schema 子路径可共同使用', () => {
		expect(SDAPITxt2ImgRequestSchema.parse({ model: 'local/image', prompt: 'landscape' }).model).toBe('local/image');
		expect(OpenAIImageGenerationsResponseSchema.parse({ created: 1, data: [{ b64_json: 'AA==' }] })).toEqual(
			OpenAIImageEditsResponseSchema.parse({ created: 1, data: [{ b64_json: 'AA==' }] }),
		);
	});

	test('接受没有新增 cache/container 字段的 Anthropic 响应和流事件', () => {
		expect(AnthropicMessagesResponseSchema.parse(message).usage).toEqual({ input_tokens: 4, output_tokens: 2 });
		expect(AnthropicMessagesStreamEventSchema.parse({ type: 'message_start', message })).toMatchObject({
			type: 'message_start',
		});
		expect(
			AnthropicMessagesStreamEventSchema.parse({
				type: 'message_delta',
				delta: { stop_reason: 'end_turn', stop_sequence: null },
				usage: { output_tokens: 2 },
			}),
		).toMatchObject({ usage: { output_tokens: 2 } });
	});

	test('支持 Anthropic 服务端工具，仍拒绝已知类型中的缺失字段', () => {
		const request = { model: 'local/assistant', max_tokens: 32_768, messages: [{ role: 'user', content: 'search' }] };
		expect(
			AnthropicMessagesRequestSchema.parse({
				...request,
				tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }],
			}).tools,
		).toHaveLength(1);
		expect(
			AnthropicMessagesRequestSchema.safeParse({ ...request, tools: [{ type: 'custom', name: 'invalid' }] }).success,
		).toBe(false);
		for (const source of [{ type: 'base64' }, { type: 'url', data: 'AA==' }]) {
			expect(
				AnthropicMessagesRequestSchema.safeParse({
					...request,
					messages: [{ role: 'user', content: [{ type: 'image', source }] }],
				}).success,
			).toBe(false);
		}
	});

	test('Chat 支持 audio/file 内容、custom tools 及增量工具输入', () => {
		const request = OpenAIChatCompletionsRequestSchema.parse({
			model: 'local/chat',
			messages: [
				{
					role: 'user',
					content: [
						{ type: 'input_audio', input_audio: { data: 'AA==', format: 'wav' } },
						{ type: 'file', file: { file_id: 'file-1' } },
					],
				},
			],
			tools: [{ type: 'custom', custom: { name: 'code', format: { type: 'text' } } }],
		});
		expect(request.tools?.[0]).toMatchObject({ type: 'custom' });
		expect(
			OpenAIChatCompletionsChunkSchema.parse({
				id: 'chat-1',
				object: 'chat.completion.chunk',
				created: 1,
				model: 'local/chat',
				choices: [
					{
						index: 0,
						finish_reason: null,
						delta: { tool_calls: [{ index: 0, type: 'custom', custom: { input: 'print' } }] },
					},
				],
			}),
		).toMatchObject({ id: 'chat-1' });
		expect(
			OpenAIChatCompletionsRequestSchema.safeParse({
				model: 'chat',
				messages: [{ role: 'user', content: [{ type: 'input_audio' }] }],
			}).success,
		).toBe(false);
	});

	test('Responses 延续与 compact 保留加密状态，不放行缺失的 compaction 内容', () => {
		expect(
			OpenAIResponsesRequestSchema.parse({ model: 'local/reasoning', previous_response_id: 'resp-1' }),
		).toMatchObject({ previous_response_id: 'resp-1' });
		expect(
			OpenAIResponsesCompactRequestSchema.parse({
				model: 'local/reasoning',
				input: [{ role: 'user', content: 'hello' }],
			}),
		).toHaveProperty('input');
		const compacted = OpenAIResponsesCompactResponseSchema.parse({
			id: 'compact-1',
			object: 'response.compaction',
			created_at: 1,
			output: [{ id: 'item-1', type: 'compaction', encrypted_content: 'opaque-data' }],
			usage: { input_tokens: 10, output_tokens: 2, total_tokens: 12 },
		});
		expect(OpenAIResponsesRequestSchema.parse({ model: 'local/reasoning', input: compacted.output }).input).toEqual(
			compacted.output,
		);
		expect(
			OpenAIResponsesRequestSchema.safeParse({ model: 'local/reasoning', input: [{ type: 'compaction' }] }).success,
		).toBe(false);
	});

	test('Responses 接受内置/自定义工具并拒绝缺失名称的 function 工具', () => {
		const request = { model: 'local/reasoning', input: 'search' };
		expect(
			OpenAIResponsesRequestSchema.parse({
				...request,
				tools: [{ type: 'web_search' }, { type: 'custom', name: 'code' }],
			}).tools,
		).toHaveLength(2);
		expect(OpenAIResponsesRequestSchema.safeParse({ ...request, tools: [{ type: 'function' }] }).success).toBe(false);
	});

	test('OpenAI batch 元数据和失败 JSONL 行，Anthropic batch 重用消息边界', () => {
		expect(
			OpenAIBatchesCreateRequestSchema.parse({
				input_file_id: 'file-1',
				endpoint: '/v1/responses',
				completion_window: '24h',
			}),
		).toHaveProperty('endpoint', '/v1/responses');
		expect(
			OpenAIBatchesListResponseSchema.parse({
				object: 'list',
				data: [],
				has_more: false,
				first_id: null,
				last_id: null,
			}).data,
		).toEqual([]);
		expect(
			OpenAIBatchResponseLineSchema.parse({
				id: 'batch-1',
				custom_id: 'request-1',
				response: null,
				error: { code: 'batch_expired', message: 'expired' },
			}).error,
		).toHaveProperty('code', 'batch_expired');
		expect(
			AnthropicMessagesBatchesCreateRequestSchema.parse({
				requests: [
					{
						custom_id: 'r1',
						params: { model: 'local/assistant', max_tokens: 4096, messages: [{ role: 'user', content: 'hi' }] },
					},
				],
			}).requests,
		).toHaveLength(1);
		expect(
			AnthropicMessageBatchResultSchema.parse({ custom_id: 'r1', result: { type: 'succeeded', message } }),
		).toHaveProperty('custom_id', 'r1');
		expect(
			AnthropicMessageBatchResultSchema.safeParse({ custom_id: 'r1', result: { type: 'succeeded' } }).success,
		).toBe(false);
		expect(AnthropicMessagesBatchesCreateRequestSchema.safeParse({ requests: [] }).success).toBe(false);
	});

	test('语音使用二进制响应，转写支持 multipart 文件与 JSON/文本输出', () => {
		expect(
			OpenAIAudioSpeechRequestSchema.parse({
				model: 'local/tts',
				input: 'hello',
				voice: 'default',
				response_format: 'wav',
			}).voice,
		).toBe('default');
		expect(OpenAIAudioSpeechResponseSchema.parse(new Uint8Array([1, 2]))).toEqual(new Uint8Array([1, 2]));
		expect(OpenAIAudioSpeechResponseSchema.safeParse({ text: 'invalid' }).success).toBe(false);
		const file = new File(['audio'], 'sample.wav', { type: 'audio/wav' });
		expect(
			OpenAIAudioTranscriptionsRequestSchema.parse({ model: 'local/asr', file, temperature: '0.5', stream: 'false' }),
		).toMatchObject({ temperature: 0.5, stream: false });
		expect(
			OpenAIAudioTranscriptionsResponseSchema.parse({ text: 'hello', language: 'en', duration: 1 }).valueOf(),
		).toHaveProperty('text', 'hello');
		expect(OpenAIAudioTranscriptionsResponseSchema.parse('00:00:00.000 --> 00:00:01.000\nhello')).toContain('hello');
		expect(OpenAIAudioTranscriptionsRequestSchema.safeParse({ model: 'asr', file: 'not a File' }).success).toBe(false);
	});
});
