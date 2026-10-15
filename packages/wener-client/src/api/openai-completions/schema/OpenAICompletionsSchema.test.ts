import { describe, expect, test } from 'vitest';
import { OpenAICompletionsRequestSchema } from './OpenAICompletionsSchema';

describe('OpenAI completions schemas', () => {
	test('completions nullable 参数和省略 prompt 原样保留，不生成默认值', () => {
		expect(OpenAICompletionsRequestSchema.parse({ model: '' })).toStrictEqual({ model: '' });
		const request = {
			model: '',
			prompt: null,
			best_of: null,
			echo: null,
			frequency_penalty: null,
			logit_bias: null,
			logprobs: null,
			max_tokens: null,
			n: null,
			presence_penalty: null,
			seed: null,
			stop: null,
			stream: null,
			stream_options: null,
			suffix: null,
			temperature: null,
			top_p: null,
		};
		expect(OpenAICompletionsRequestSchema.parse(request)).toStrictEqual(request);
	});

	test('completions 接受官方参数边界和全部 prompt 形态', () => {
		for (const prompt of ['', [''], [0], [[0]], null]) {
			const request = {
				model: '',
				prompt,
				best_of: 0,
				n: 1,
				max_tokens: 0,
				logit_bias: { '1': -100 },
				stream_options: { include_usage: true },
			};
			expect(OpenAICompletionsRequestSchema.parse(request)).toStrictEqual(request);
		}
		for (const fields of [
			{ best_of: -1 },
			{ n: 0 },
			{ logit_bias: { '1': 0.5 } },
			{ stream_options: { include_usage: 1 } },
		]) {
			expect(OpenAICompletionsRequestSchema.safeParse({ model: '', ...fields }).success).toBe(false);
		}
		expect(OpenAICompletionsRequestSchema.safeParse({ prompt: '' }).success).toBe(false);
	});
});
