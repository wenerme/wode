import { describe, expect, test } from 'vitest';
import { SDAPITxt2ImgRequestSchema, SDAPITxt2ImgResponseSchema } from './index';

describe('SDAPI 文生图协议', () => {
	test('直连最小请求无需模型或默认参数', () => {
		expect(SDAPITxt2ImgRequestSchema.parse({ prompt: 'A lighthouse at sunset' })).toEqual({
			prompt: 'A lighthouse at sunset',
		});
		expect(SDAPITxt2ImgRequestSchema.parse({})).toEqual({});
	});

	test('保留代理模型、ControlNet 和未知扩展', () => {
		const request = {
			model: 'caller-selected-model',
			prompt: ['A lighthouse', 'An ocean'],
			negative_prompt: ['blurry', 'low quality'],
			seed: -1,
			subseed: -1,
			steps: 20,
			width: 512,
			height: 768,
			cfg_scale: 7,
			sampler_name: 'Euler',
			override_settings: { CLIP_stop_at_last_layers: 2, extension_setting: true },
			override_settings_restore_afterwards: true,
			alwayson_scripts: {
				ControlNet: {
					args: [{ enabled: true, module: 'canny', model: 'caller-selected-controlnet', image: 'AA==', weight: 1 }],
					extension_revision: 1,
				},
			},
			proxy_extension: { priority: 1 },
		};
		expect(SDAPITxt2ImgRequestSchema.parse(request)).toEqual(request);
		expect(SDAPITxt2ImgRequestSchema.safeParse({ model: 123 }).success).toBe(false);
	});

	test('校验高分辨率字段并允许自动尺寸和步数', () => {
		const request = {
			enable_hr: true,
			hr_scale: 2,
			hr_upscaler: 'Latent',
			hr_second_pass_steps: 0,
			hr_resize_x: 0,
			hr_resize_y: 1024,
			hr_prompt: 'A detailed lighthouse',
			denoising_strength: 0.45,
		};
		expect(SDAPITxt2ImgRequestSchema.parse(request)).toEqual(request);
		for (const invalid of [{ hr_scale: 0 }, { hr_resize_x: -1 }, { hr_second_pass_steps: 1.5 }, { width: 0 }]) {
			expect(SDAPITxt2ImgRequestSchema.safeParse(invalid).success).toBe(false);
		}
	});

	test('返回图片并保持字符串信息', () => {
		const response = { images: ['AA=='], parameters: { prompt: 'A lighthouse' }, info: '{"seed":42}' };
		expect(SDAPITxt2ImgResponseSchema.parse(response)).toEqual(response);
		expect(SDAPITxt2ImgResponseSchema.parse({ ...response, images: [] }).images).toEqual([]);
	});
});
