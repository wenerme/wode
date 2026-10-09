import { describe, expect, test } from 'vitest';
import { ApiType } from '../../schema/ApiType';
import { OpenAIModelSchema } from './OpenAIModelsSchema';

describe('OpenAIModelSchema', () => {
	test('使用复数形式描述自定义输入、输出模态和API能力', () => {
		const model = OpenAIModelSchema.parse({
			id: 'gpt-demo',
			object: 'model',
			created: 0,
			owned_by: 'configured',
			apis: [ApiType.OpenAIChatCompletions],
			inputs: ['text', 'image'],
			outputs: ['text'],
		});

		expect(model.apis).toEqual([ApiType.OpenAIChatCompletions]);
		expect(model.inputs).toEqual(['text', 'image']);
		expect(model.outputs).toEqual(['text']);
	});
});
