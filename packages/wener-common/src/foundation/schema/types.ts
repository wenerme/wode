import z from 'zod/v4';

export const CoordinatesSchema = z
	.object({
		latitude: z.number().min(-90).max(90).describe('纬度'),
		longitude: z.number().min(-180).max(180).describe('经度'),
	})
	.describe('坐标信息');
