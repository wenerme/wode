import { z } from 'zod';
import { SDAPIImageGenerationParametersSchema, SDAPIImageGenerationResponseSchema } from '../../sdapi/schema';

export const SDAPITxt2ImgRequestSchema = SDAPIImageGenerationParametersSchema.extend({
	enable_hr: z.boolean().optional(),
	hr_scale: z.number().positive().optional(),
	hr_upscaler: z.string().optional(),
	hr_second_pass_steps: z.number().int().nonnegative().optional(),
	hr_resize_x: z.number().int().nonnegative().optional(),
	hr_resize_y: z.number().int().nonnegative().optional(),
	hr_checkpoint_name: z.string().optional(),
	hr_sampler_name: z.string().optional(),
	hr_scheduler: z.string().optional(),
	hr_prompt: z.union([z.string(), z.array(z.string())]).optional(),
	hr_negative_prompt: z.union([z.string(), z.array(z.string())]).optional(),
	firstphase_width: z.number().int().nonnegative().optional(),
	firstphase_height: z.number().int().nonnegative().optional(),
});

export const SDAPITxt2ImgResponseSchema = SDAPIImageGenerationResponseSchema;

export type SDAPITxt2ImgRequest = z.infer<typeof SDAPITxt2ImgRequestSchema>;
export type SDAPITxt2ImgResponse = z.infer<typeof SDAPITxt2ImgResponseSchema>;
