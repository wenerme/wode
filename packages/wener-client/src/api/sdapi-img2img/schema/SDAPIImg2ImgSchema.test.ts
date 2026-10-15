import { describe, expect, test } from 'vitest';
import { SDAPIImg2ImgRequestSchema, SDAPIImg2ImgResponseSchema } from './index';

describe('SDAPI 图生图协议', () => {
	test('最小请求必须有非空初始图片', () => {
		const request = { init_images: ['data:image/png;base64,AA=='] };
		expect(SDAPIImg2ImgRequestSchema.parse(request)).toEqual(request);
		for (const invalid of [{}, { init_images: [] }, { init_images: [''] }, { init_images: [123] }]) {
			expect(SDAPIImg2ImgRequestSchema.safeParse(invalid).success).toBe(false);
		}
	});

	test('兼容空遮罩、代理模型和局部重绘参数', () => {
		const request = {
			model: 'caller-selected-model',
			init_images: ['AA=='],
			prompt: 'Restore this photo',
			mask: null,
			seed: -1,
			subseed: -1,
			resize_mode: 1,
			denoising_strength: 0.75,
			mask_blur: 4,
			inpainting_fill: 1,
			inpaint_full_res: true,
			inpaint_full_res_padding: 32,
			inpainting_mask_invert: 0,
			include_init_images: true,
			send_images: false,
			alwayson_scripts: { ControlNet: { args: [{ enabled: true, image: 'AA==', module: 'reference_only' }] } },
			proxy_extension: { queue: 'interactive' },
		};
		expect(SDAPIImg2ImgRequestSchema.parse(request)).toEqual(request);
		expect(SDAPIImg2ImgRequestSchema.parse({ init_images: ['AA=='], mask: 'AQ==' }).mask).toBe('AQ==');
	});

	test('已知图生图字段和尺寸不能通过扩展机制绕过校验', () => {
		for (const invalid of [
			{ width: -1 },
			{ height: 1.5 },
			{ mask: 123 },
			{ resize_mode: '1' },
			{ mask_blur: -1 },
			{ include_init_images: 1 },
		]) {
			expect(SDAPIImg2ImgRequestSchema.safeParse({ init_images: ['AA=='], ...invalid }).success).toBe(false);
		}
	});

	test('不发送图片时仍可解析原始响应', () => {
		const response = {
			images: [],
			parameters: { init_images: ['AA=='], send_images: false },
			info: '{"seed":42}',
			extension: true,
		};
		expect(SDAPIImg2ImgResponseSchema.parse(response)).toEqual(response);
		expect(SDAPIImg2ImgResponseSchema.safeParse({ ...response, info: {} }).success).toBe(false);
	});
});
