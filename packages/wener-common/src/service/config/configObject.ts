import { z } from 'zod';

export class CliConfigError extends Error {
	constructor(message = 'Invalid CLI configuration') {
		super(message);
		this.name = 'CliConfigError';
	}
}

/** custom 消息均由本目录的校验器定义；不转发 Zod 的动态路径或输入。 */
export function configErrorMessage(error: z.ZodError): string {
	return error.issues.find((issue) => issue.code === 'custom')?.message ?? 'Invalid CLI configuration';
}

/** 配置错误不携带输入值或动态字段路径；保留名为 __proto__ 的普通扩展字段。 */
export function configObject<S extends z.ZodType<Record<string, unknown>>>(schema: S) {
	return z.unknown().transform((input, context): z.output<S> => {
		if (!isConfigRecord(input)) {
			context.addIssue({ code: 'custom', message: 'Invalid CLI configuration' });
			return z.NEVER;
		}
		const result = schema.safeParse(input);
		if (!result.success) {
			context.addIssue({ code: 'custom', message: configErrorMessage(result.error) });
			return z.NEVER;
		}
		if (Object.hasOwn(input, '__proto__')) {
			Object.defineProperty(result.data, '__proto__', {
				value: input.__proto__,
				enumerable: true,
				writable: true,
				configurable: true,
			});
		}
		return result.data;
	});
}

export function isConfigRecord(value: unknown): value is Record<string, unknown> {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
	const prototype = Object.getPrototypeOf(value);
	if (prototype === null) return true;
	const constructor = Object.getOwnPropertyDescriptor(prototype, 'constructor')?.value;
	return (
		Object.getPrototypeOf(prototype) === null &&
		typeof constructor === 'function' &&
		Function.prototype.toString.call(constructor) === Function.prototype.toString.call(Object)
	);
}
