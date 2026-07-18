import { describe, expect, it } from 'vite-plus/test';
import { z } from 'zod/v4';
import { formatZodError } from './formatZodError';

describe('formatZodError', () => {
	it('should format invalid_type error', () => {
		const schema = z.object({
			name: z.string(),
			age: z.number(),
		});

		const result = schema.safeParse({ name: 123, age: 'not-a-number' });
		expect(result.success).toBe(false);
		if (!result.success) {
			const formatted = formatZodError(result.error);
			expect(formatted).toContain('name');
			expect(formatted).toContain('age');
		}
	});

	it('should format required field error', () => {
		const schema = z.object({
			name: z.string(),
			email: z.string().email(),
		});

		const result = schema.safeParse({});
		expect(result.success).toBe(false);
		if (!result.success) {
			const formatted = formatZodError(result.error);
			expect(formatted).toContain('必填');
		}
	});

	it('should format email validation error', () => {
		const schema = z.object({
			email: z.string().email(),
		});

		const result = schema.safeParse({ email: 'invalid-email' });
		expect(result.success).toBe(false);
		if (!result.success) {
			const formatted = formatZodError(result.error);
			expect(formatted).toContain('请输入有效的邮箱地址');
		}
	});

	it('should format URL validation error', () => {
		const schema = z.object({
			url: z.string().url(),
		});

		const result = schema.safeParse({ url: 'not-a-url' });
		expect(result.success).toBe(false);
		if (!result.success) {
			const formatted = formatZodError(result.error);
			expect(formatted).toContain('请输入有效的 URL');
		}
	});

	it('should format too_small error for string', () => {
		const schema = z.object({
			name: z.string().min(5),
		});

		const result = schema.safeParse({ name: 'abc' });
		expect(result.success).toBe(false);
		if (!result.success) {
			const formatted = formatZodError(result.error);
			expect(formatted).toContain('至少需要');
		}
	});

	it('should format too_small error for number', () => {
		const schema = z.object({
			age: z.number().min(18),
		});

		const result = schema.safeParse({ age: 16 });
		expect(result.success).toBe(false);
		if (!result.success) {
			const formatted = formatZodError(result.error);
			expect(formatted).toContain('至少需要 18');
		}
	});

	it('should format too_big error for string', () => {
		const schema = z.object({
			name: z.string().max(10),
		});

		const result = schema.safeParse({ name: 'this is too long' });
		expect(result.success).toBe(false);
		if (!result.success) {
			const formatted = formatZodError(result.error);
			expect(formatted).toContain('最多 10 个字符');
		}
	});

	it('should format invalid_enum_value error', () => {
		const schema = z.object({
			status: z.enum(['active', 'inactive', 'pending']),
		});

		const result = schema.safeParse({ status: 'invalid' });
		expect(result.success).toBe(false);
		if (!result.success) {
			const formatted = formatZodError(result.error);
			expect(formatted).toContain('必须是以下值之一');
		}
	});

	it('should format invalid_literal error', () => {
		const schema = z.object({
			type: z.literal('user'),
		});

		const result = schema.safeParse({ type: 'admin' });
		expect(result.success).toBe(false);
		if (!result.success) {
			const formatted = formatZodError(result.error);
			expect(formatted).toContain('必须是 user');
		}
	});

	it('should format nested object errors', () => {
		const schema = z.object({
			user: z.object({
				name: z.string(),
				email: z.string().email(),
			}),
		});

		const result = schema.safeParse({
			user: {
				name: '',
				email: 'invalid',
			},
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const formatted = formatZodError(result.error);
			expect(formatted).toContain('user');
			expect(formatted).toContain('email');
		}
	});

	it('should format array errors', () => {
		const schema = z.object({
			tags: z.array(z.string()).min(1),
		});

		const result = schema.safeParse({ tags: [] });
		expect(result.success).toBe(false);
		if (!result.success) {
			const formatted = formatZodError(result.error);
			expect(formatted).toContain('至少需要 1 项');
		}
	});

	it('should format multiple errors', () => {
		const schema = z.object({
			name: z.string().min(1),
			email: z.string().email(),
			age: z.number().min(18),
		});

		const result = schema.safeParse({
			name: '',
			email: 'invalid',
			age: 15,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const formatted = formatZodError(result.error);
			// Should contain multiple error messages separated by '；'
			const parts = formatted.split('；');
			expect(parts.length).toBeGreaterThan(1);
		}
	});

	it('should use schema description when available', () => {
		const schema = z.object({
			name: z.string().min(1).describe('姓名'),
			email: z.string().email().describe('邮箱地址'),
		});

		// Use empty string for name (triggers min(1) error) and invalid email
		const result = schema.safeParse({ name: '', email: 'invalid' });
		expect(result.success).toBe(false);
		if (!result.success) {
			const formatted = formatZodError(result.error, schema);
			expect(formatted).toContain('姓名');
			expect(formatted).toContain('邮箱地址');
		}
	});
});
