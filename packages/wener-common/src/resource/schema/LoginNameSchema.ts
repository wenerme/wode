import { z } from 'zod/v4';

export const LoginNameSchema = z
	.string()
	.trim()
	.regex(/^[a-z0-9]{3,16}$/, { error: '登录名只能包含小写字母和数字，长度为3-16位' });
