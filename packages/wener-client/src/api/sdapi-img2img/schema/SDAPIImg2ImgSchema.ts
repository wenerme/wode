import { z } from 'zod';
import { SDAPIImageGenerationParametersSchema, SDAPIImageGenerationResponseSchema } from '../../sdapi/schema';

export const SDAPIImg2ImgRequestSchema = SDAPIImageGenerationParametersSchema.extend({
	init_images: z.array(z.string().min(1)).min(1),
	mask: z.string().nullable().optional(),
	resize_mode: z.number().int().nonnegative().optional(),
	image_cfg_scale: z.number().optional(),
	mask_blur: z.number().int().nonnegative().optional(),
	mask_blur_x: z.number().int().nonnegative().optional(),
	mask_blur_y: z.number().int().nonnegative().optional(),
	inpainting_fill: z.number().int().nonnegative().optional(),
	inpaint_full_res: z.boolean().optional(),
	inpaint_full_res_padding: z.number().int().nonnegative().optional(),
	inpainting_mask_invert: z.number().int().nonnegative().optional(),
	initial_noise_multiplier: z.number().optional(),
	include_init_images: z.boolean().optional(),
});

export const SDAPIImg2ImgResponseSchema = SDAPIImageGenerationResponseSchema;

export type SDAPIImg2ImgRequest = z.infer<typeof SDAPIImg2ImgRequestSchema>;
export type SDAPIImg2ImgResponse = z.infer<typeof SDAPIImg2ImgResponseSchema>;
