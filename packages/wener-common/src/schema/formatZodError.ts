import type { core, ZodError } from 'zod/v4';
import { findJsonSchemaByPath } from './findJsonSchemaByPath';
import type { TypeSchema } from './TypeSchema';

// Zod 4 issue types with proper typing
type ZodIssue = core.$ZodIssue;
type ZodIssueInvalidType = core.$ZodIssueInvalidType;
type ZodIssueTooSmall = core.$ZodIssueTooSmall;
type ZodIssueTooBig = core.$ZodIssueTooBig;
type ZodIssueInvalidStringFormat = core.$ZodIssueInvalidStringFormat;
type ZodIssueInvalidValue = core.$ZodIssueInvalidValue;
type ZodIssueUnrecognizedKeys = core.$ZodIssueUnrecognizedKeys;

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

function formatIssueMessage(issue: ZodIssue, _schema?: TypeSchema): string {
	let message = issue.message;

	// 处理常见的错误类型，生成更友好的消息
	switch (issue.code) {
		case 'invalid_type': {
			const i = issue as ZodIssueInvalidType;
			// Zod v4 doesn't have 'received' field directly, extract from message
			const match = issue.message.match(/received (\w+)/);
			const received = match?.[1];
			if (received === 'undefined') {
				message = '必填';
			} else if (received === 'null') {
				message = '不能为空';
			} else {
				message = issue.message || `期望类型 ${i.expected}，但收到 ${received}`;
			}
			break;
		}
		case 'invalid_format': {
			const i = issue as ZodIssueInvalidStringFormat;
			if (i.format === 'email') {
				message = '请输入有效的邮箱地址';
			} else if (i.format === 'url') {
				message = '请输入有效的 URL';
			} else if (i.format === 'uuid') {
				message = '请输入有效的 UUID';
			} else if (i.format === 'date') {
				message = '请输入有效的日期';
			}
			break;
		}
		case 'too_small': {
			const i = issue as ZodIssueTooSmall;
			if (i.origin === 'string' && i.minimum === 1) {
				message = '不能为空';
			} else if (i.origin === 'string') {
				message = `至少需要 ${i.minimum} 个字符`;
			} else if (i.origin === 'number' || i.origin === 'int') {
				message = `至少需要 ${i.minimum}`;
			} else if (i.origin === 'array') {
				message = `至少需要 ${i.minimum} 项`;
			}
			break;
		}
		case 'too_big': {
			const i = issue as ZodIssueTooBig;
			if (i.origin === 'string') {
				message = `最多 ${i.maximum} 个字符`;
			} else if (i.origin === 'number' || i.origin === 'int') {
				message = `最多 ${i.maximum}`;
			} else if (i.origin === 'array') {
				message = `最多 ${i.maximum} 项`;
			}
			break;
		}
		case 'invalid_value': {
			const i = issue as ZodIssueInvalidValue;
			if (i.values.length === 1) {
				// Single value means it's a literal check
				message = `必须是 ${String(i.values[0])}`;
			} else {
				message = `必须是以下值之一: ${i.values.map(String).join(', ')}`;
			}
			break;
		}
		case 'unrecognized_keys': {
			const i = issue as ZodIssueUnrecognizedKeys;
			message = `不支持的字段: ${i.keys.join(', ')}`;
			break;
		}
		case 'invalid_union': {
			message = '不符合任何允许的类型';
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
