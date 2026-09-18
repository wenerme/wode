import { z } from 'zod/v4';

const TypedUlidResourceIdPattern = /^[a-z][a-z0-9]*_[0-7][0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{25}$/u;

export const ResourceIdSchema = z
	.string()
	.regex(TypedUlidResourceIdPattern, {
		error: 'ID格式错误',
	})
	.transform((value) => value.toLowerCase())
	.meta({
		description: 'ID',
		examples: ['usr_01k856bpkm2rkhgqp7vwrfpq57'],
		pattern: '^[a-z][a-z0-9]*_[0-7][0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{25}$',
		type: 'string',
	});
