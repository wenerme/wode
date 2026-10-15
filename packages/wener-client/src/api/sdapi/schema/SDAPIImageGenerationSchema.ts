import { z } from 'zod';

const prompt = z.union([z.string(), z.array(z.string())]);
const positiveInteger = z.number().int().positive();

export const SDAPIImageGenerationParametersSchema = z.looseObject({
	// 代理路由可由调用方提供模型，直连服务无需填写。
	model: z.string().min(1).optional(),
	prompt: prompt.optional(),
	negative_prompt: prompt.optional(),
	steps: positiveInteger.optional(),
	width: positiveInteger.optional(),
	height: positiveInteger.optional(),
	batch_size: positiveInteger.optional(),
	n_iter: positiveInteger.optional(),
	seed: z.number().int().optional(),
	subseed: z.number().int().optional(),
	subseed_strength: z.number().optional(),
	seed_resize_from_h: z.number().int().nonnegative().optional(),
	seed_resize_from_w: z.number().int().nonnegative().optional(),
	cfg_scale: z.number().optional(),
	sampler_name: z.string().optional(),
	sampler_index: z.string().optional(),
	scheduler: z.string().optional(),
	denoising_strength: z.number().optional(),
	restore_faces: z.boolean().optional(),
	tiling: z.boolean().optional(),
	override_settings: z.record(z.string(), z.unknown()).optional(),
	override_settings_restore_afterwards: z.boolean().optional(),
	restore_afterwards: z.boolean().optional(),
	script_name: z.string().nullable().optional(),
	script_args: z.array(z.unknown()).optional(),
	alwayson_scripts: z.record(z.string(), z.looseObject({ args: z.array(z.unknown()).optional() })).optional(),
	save_images: z.boolean().optional(),
	send_images: z.boolean().optional(),
	force_task_id: z.string().optional(),
	infotext: z.string().optional(),
});

export const SDAPIImageGenerationResponseSchema = z.looseObject({
	images: z.array(z.string()),
	parameters: z.record(z.string(), z.unknown()),
	// 保持服务返回的原始字符串，不解析其中的 JSON。
	info: z.string(),
});

export type SDAPIImageGenerationParameters = z.infer<typeof SDAPIImageGenerationParametersSchema>;
export type SDAPIImageGenerationResponse = z.infer<typeof SDAPIImageGenerationResponseSchema>;
