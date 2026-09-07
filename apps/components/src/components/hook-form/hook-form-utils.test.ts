import type { FieldErrors } from 'react-hook-form';
import { describe, expect, it } from 'vite-plus/test';
import { formatFieldErrors, getDirtyFieldValues, getFieldErrors } from './hook-form-utils';

describe('hook form utilities', () => {
	it('flattens nested react-hook-form errors', () => {
		const errors = {
			profile: {
				email: { message: 'Invalid email', type: 'pattern' },
			},
			items: [{ name: { message: 'Required', type: 'required' } }],
		} as unknown as FieldErrors;

		expect(getFieldErrors(errors).map(({ path, message, type }) => ({ path, message, type }))).toEqual([
			{ message: 'Invalid email', path: 'profile.email', type: 'pattern' },
			{ message: 'Required', path: 'items.0.name', type: 'required' },
		]);
		expect(formatFieldErrors(errors)).toBe('profile.email: Invalid email; items.0.name: Required');
	});

	it('returns fallback text when no field errors exist', () => {
		expect(formatFieldErrors(undefined, { fallback: 'ok' })).toBe('ok');
		expect(getFieldErrors(undefined)).toEqual([]);
	});

	it('extracts dirty values from nested objects and arrays', () => {
		const dirty = {
			name: true,
			profile: { age: true, title: false },
			roles: [{ code: true }, false, { enabled: true }],
		};
		const values = {
			name: 'Wener',
			profile: { age: 18, title: 'Admin' },
			roles: [{ code: 'owner' }, { code: 'viewer' }, { enabled: undefined }],
		};

		expect(getDirtyFieldValues(dirty, values)).toEqual({
			name: 'Wener',
			profile: { age: 18 },
			roles: [{ code: 'owner' }, undefined, { enabled: undefined }],
		});
	});

	it('returns an empty object when no fields are dirty', () => {
		expect(getDirtyFieldValues({ name: false }, { name: 'Wener' })).toEqual({});
	});
});
