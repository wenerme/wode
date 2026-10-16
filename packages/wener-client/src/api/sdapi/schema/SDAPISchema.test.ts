import { describe, expect, test } from 'vitest';
import { SDAPIErrorSchema, SDAPIImageGenerationParametersSchema, SDAPIImageGenerationResponseSchema } from './index';

describe('SDAPI 共用协议', () => {
	test('可选参数不注入默认值，已知字段仍须校验', () => {
		expect(SDAPIImageGenerationParametersSchema.parse({})).toEqual({});
		expect(SDAPIImageGenerationParametersSchema.parse({ seed: -1, subseed: -1 })).toEqual({ seed: -1, subseed: -1 });
		for (const field of ['steps', 'width', 'height', 'batch_size', 'n_iter']) {
			for (const value of [0, -1, 1.5, '512']) {
				expect(SDAPIImageGenerationParametersSchema.safeParse({ [field]: value }).success).toBe(false);
			}
		}
		expect(SDAPIImageGenerationParametersSchema.safeParse({ seed: 0.5 }).success).toBe(false);
		expect(SDAPIImageGenerationParametersSchema.safeParse({ send_images: 'false' }).success).toBe(false);
		expect(
			SDAPIImageGenerationParametersSchema.safeParse({ alwayson_scripts: { ControlNet: { args: {} } } }).success,
		).toBe(false);
	});

	test('空图片响应保持原始信息字符串和未知字段', () => {
		const response = {
			images: [],
			parameters: { send_images: false, extension: { enabled: true } },
			info: '{"seed":-1,"all_seeds":[123]}',
			task_id: 'task-synthetic',
		};
		expect(SDAPIImageGenerationResponseSchema.parse(response)).toEqual(response);
		expect(SDAPIImageGenerationResponseSchema.safeParse({ ...response, info: { seed: -1 } }).success).toBe(false);
		expect(SDAPIImageGenerationResponseSchema.safeParse({ ...response, images: [123] }).success).toBe(false);
		expect(SDAPIImageGenerationResponseSchema.safeParse({ images: [] }).success).toBe(false);
	});

	test('兼容验证错误、服务错误及扩展错误', () => {
		for (const error of [
			{ detail: [{ loc: ['body', 'init_images'], msg: 'Field required', type: 'missing' }] },
			{ detail: 'Invalid request' },
			{ error: 'RuntimeError', errors: 'Model unavailable', body: '', trace_id: 'synthetic' },
			{ errors: [{ message: 'Invalid image' }], body: { init_images: [] } },
		]) {
			expect(SDAPIErrorSchema.parse(error)).toEqual(error);
		}
		expect(SDAPIErrorSchema.parse({})).toEqual({});
	});
});
