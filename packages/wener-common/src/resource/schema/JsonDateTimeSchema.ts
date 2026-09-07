import { z } from 'zod/v4';

const Rfc3339DateTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u;

export const JsonDateTimeSchema = z
	.string()
	.regex(Rfc3339DateTimePattern, { error: '错误的日期时间' })
	.pipe(z.iso.datetime({ error: '错误的日期时间', offset: true }))
	.transform((value) => new Date(value).toISOString())
	.meta({ format: 'date-time', type: 'string' });
