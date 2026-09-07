import { z } from 'zod';

// maybe check valid cjk
export const DisplayNameSchema = z
	.string()
	.trim()
	.max(50)
	.refine((v) => !/\p{C}/u.test(v), { message: '包含无效字符' })
	.describe('名称');
