import { ZodError } from 'zod/v4';
import { findJsonSchemaByPath } from './findJsonSchemaByPath';
import type { TypeSchema } from './TypeSchema';

export function formatZodError(error: ZodError, schema?: TypeSchema): string {
	if (!error.issues || error.issues.length === 0) {
		return error.message || '验证失败';
	}

	const messages: string[] = [];

	// Iterate through issues and format each one
	// We use manual iteration instead of error.format() to have better control
	// over field name formatting with schema descriptions
	for (const issue of error.issues) {
		const formatted = formatIssueMessage(issue, schema);
		if (formatted) {
			const path = issue.path.map((p) => (typeof p === 'symbol' ? String(p) : p)) as (string | number)[];
			let fieldName = formatPath(path);

			// Try to get field description from schema
			if (schema && path.length > 0) {
				const fieldPath = path.map(String).join('.');
				const fieldSchema = findJsonSchemaByPath(schema, fieldPath);
				if (fieldSchema?.description) {
					fieldName = fieldSchema.description;
				}
			}

			messages.push(`${fieldName}: ${formatted}`);
		}
	}

	return messages.join('；');
}

function formatIssueMessage(issue: ZodError['issues'][number], schema?: TypeSchema): string {
	let message = issue.message;

	// 处理常见的错误类型，生成更友好的消息
	// Use string comparison to avoid TypeScript narrowing issues with Zod v4
	const code = issue.code as string;
	switch (code) {
		case 'invalid_type': {
			const invalidTypeIssue = issue as typeof issue & {
				expected: string;
				received: string;
			};
			if (invalidTypeIssue.received === 'undefined') {
				message = '必填';
			} else if (invalidTypeIssue.received === 'null') {
				message = '不能为空';
			} else {
				message = issue.message || `期望类型 ${invalidTypeIssue.expected}，但收到 ${invalidTypeIssue.received}`;
			}
			break;
		}
		case 'invalid_string': {
			const invalidStringIssue = issue as typeof issue & {
				validation?: string;
			};
			if (invalidStringIssue.validation === 'email') {
				message = '请输入有效的邮箱地址';
			} else if (invalidStringIssue.validation === 'url') {
				message = '请输入有效的 URL';
			} else if (invalidStringIssue.validation === 'uuid') {
				message = '请输入有效的 UUID';
			} else if (invalidStringIssue.validation === 'date') {
				message = '请输入有效的日期';
			}
			break;
		}
		case 'too_small': {
			const tooSmallIssue = issue as typeof issue & {
				type: string;
				minimum: number;
			};
			if (tooSmallIssue.type === 'string' && tooSmallIssue.minimum === 1) {
				message = '不能为空';
			} else if (tooSmallIssue.type === 'number') {
				message = `至少需要 ${tooSmallIssue.minimum}`;
			} else if (tooSmallIssue.type === 'array') {
				message = `至少需要 ${tooSmallIssue.minimum} 项`;
			}
			break;
		}
		case 'too_big': {
			const tooBigIssue = issue as typeof issue & {
				type: string;
				maximum: number;
			};
			if (tooBigIssue.type === 'string') {
				message = `最多 ${tooBigIssue.maximum} 个字符`;
			} else if (tooBigIssue.type === 'number') {
				message = `最多 ${tooBigIssue.maximum}`;
			} else if (tooBigIssue.type === 'array') {
				message = `最多 ${tooBigIssue.maximum} 项`;
			}
			break;
		}
		case 'invalid_enum_value': {
			const enumIssue = issue as typeof issue & {
				options: readonly unknown[];
			};
			message = `必须是以下值之一: ${enumIssue.options?.map(String).join(', ') || '未知选项'}`;
			break;
		}
		case 'unrecognized_keys': {
			const unrecognizedIssue = issue as typeof issue & {
				keys: readonly string[];
			};
			message = `不支持的字段: ${unrecognizedIssue.keys?.join(', ') || '未知字段'}`;
			break;
		}
		case 'invalid_union': {
			message = '不符合任何允许的类型';
			break;
		}
		case 'invalid_union_discriminator': {
			const discriminatorIssue = issue as typeof issue & {
				options: readonly unknown[];
			};
			message = `必须是以下值之一: ${discriminatorIssue.options?.map(String).join(', ') || '未知选项'}`;
			break;
		}
		case 'invalid_literal': {
			const literalIssue = issue as typeof issue & {
				expected: unknown;
			};
			message = `必须是 ${String(literalIssue.expected)}`;
			break;
		}
		case 'custom': {
			// 保留自定义错误消息
			message = issue.message;
			break;
		}
		default:
			// 保留原始消息
			message = issue.message;
	}

	return message;
}

function formatPath(path: (string | number)[]): string {
	if (path.length === 0) {
		return '表单';
	}
	return path.map(String).join('.');
}
