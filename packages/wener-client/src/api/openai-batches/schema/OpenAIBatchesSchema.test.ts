import { describe, expect, test } from 'vitest';
import { OpenAIBatchesListResponseSchema, OpenAIBatchSchema } from './OpenAIBatchesSchema';

describe('OpenAI Batches schemas', () => {
	test('保留普通 errors.object、可选错误字段和未知结构', () => {
		const batch = {
			id: '',
			object: 'batch',
			endpoint: '',
			input_file_id: '',
			completion_window: '',
			status: 'failed',
			created_at: 1,
			extra: { keep: [null] },
		};
		for (const errors of [{}, { object: '' }, { object: 'custom', data: [{}, { param: null, line: null }] }]) {
			const value = { ...batch, errors };
			expect(OpenAIBatchSchema.parse(value)).toEqual(value);
		}
		expect(OpenAIBatchSchema.safeParse({ ...batch, errors: { object: 1 } }).success).toBe(false);
		expect(OpenAIBatchSchema.safeParse({ ...batch, errors: { data: [{ message: 1 }] } }).success).toBe(false);
		const list = { object: 'list', data: [batch], has_more: false, first_id: '', last_id: '' };
		expect(OpenAIBatchesListResponseSchema.parse(list)).toEqual(list);
		expect(OpenAIBatchesListResponseSchema.safeParse({ ...list, object: 'custom' }).success).toBe(false);
	});
});
