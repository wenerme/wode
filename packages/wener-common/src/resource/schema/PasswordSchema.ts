import { z } from 'zod/v4';

export const PasswordSchema = z
	.string()
	.min(6, { error: '密码长度至少 6 位' })
	.max(36, { error: '密码长度最多 36 位' })
	.regex(/^\S*$/, { error: '密码不能包含空格' })
	.describe('密码')
	.meta({ 'x-sensitive': true });
