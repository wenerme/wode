import { describe, expect, test } from 'vitest';

import { toJsonSchema } from '../../schema';
import { buildRedactorFormSchema, RedactedText } from '../../utils/buildRedactorFormSchema';
import { AnyResourceSchema } from './AnyResourceSchema';
import { JsonDateSchema } from './JsonDateSchema';
import { JsonDateTimeSchema } from './JsonDateTimeSchema';
import { ResourceIdSchema } from './ResourceIdSchema';
import { ResourceStatus, ResourceStatusSchema } from './ResourceStatus';

describe('Resource wire contract', () => {
	test('validates strict calendar dates without coercion', () => {
		expect(JsonDateSchema.parse('2024-02-29')).toBe('2024-02-29');
		expect(JsonDateSchema.parse('2023-12-31')).toBe('2023-12-31');
		for (const value of ['2023-02-29', '2024-02-30', '2024-2-29', '2024-02-29T00:00:00Z', 'February 29, 2024']) {
			expect(JsonDateSchema.safeParse(value).success, String(value)).toBe(false);
		}
		for (const value of [20240229, true, false, null, undefined]) {
			expect(JsonDateSchema.safeParse(value).success, String(value)).toBe(false);
		}
	});

	test('requires RFC3339 offsets and normalizes date-time output to UTC', () => {
		expect(JsonDateTimeSchema.parse('2024-02-29T10:30:00Z')).toBe('2024-02-29T10:30:00.000Z');
		expect(JsonDateTimeSchema.parse('2024-02-29T10:30:00+08:00')).toBe('2024-02-29T02:30:00.000Z');
		expect(JsonDateTimeSchema.parse('2024-02-29T10:30:00.123-05:30')).toBe('2024-02-29T16:00:00.123Z');
		for (const value of [
			'2024-02-29T10:30Z',
			'2024-02-29T10:30+08:00',
			'2024-02-29T10:30:00',
			'2024-02-30T10:30:00Z',
			'2024-02-29',
			'informal',
		]) {
			expect(JsonDateTimeSchema.safeParse(value).success, String(value)).toBe(false);
		}
		for (const value of [1_709_200_200_000, true, false, null, undefined]) {
			expect(JsonDateTimeSchema.safeParse(value).success, String(value)).toBe(false);
		}
	});

	test('preserves string wire metadata for dates and date-times', () => {
		expect(toJsonSchema(JsonDateSchema)).toMatchObject({ format: 'date', type: 'string' });
		expect(toJsonSchema(JsonDateTimeSchema)).toMatchObject({ format: 'date-time', type: 'string' });
	});

	test('accepts typed ULIDs case-insensitively and emits canonical lower-case IDs', () => {
		expect(ResourceIdSchema.parse('usr_01K856BPKM2RKHGQP7VWRFPQ57')).toBe('usr_01k856bpkm2rkhgqp7vwrfpq57');
		expect(ResourceIdSchema.parse('org_00000000000000000000000000')).toBe('org_00000000000000000000000000');
		expect(ResourceIdSchema.parse('tenant2_01k856bpkm2rkhgqp7vwrfpq57')).toBe('tenant2_01k856bpkm2rkhgqp7vwrfpq57');
	});

	test('rejects non-canonical typed resource IDs', () => {
		for (const value of [
			'Usr_01K856BPKM2RKHGQP7VWRFPQ57',
			'2usr_01K856BPKM2RKHGQP7VWRFPQ57',
			'usr_admin_01K856BPKM2RKHGQP7VWRFPQ57',
			'usr_01K856BPKM2RKHGQP7VWRFPQ5I',
			'usr_01K856BPKM2RKHGQP7VWRFPQ5L',
			'usr_01K856BPKM2RKHGQP7VWRFPQ5O',
			'usr_01K856BPKM2RKHGQP7VWRFPQ5U',
			'usr_81K856BPKM2RKHGQP7VWRFPQ57',
			'usr_550e8400e29b41d4a716446655440000',
			'usr_550e8400-e29b-41d4-a716-446655440000',
			'usr_arbitrary',
		]) {
			expect(ResourceIdSchema.safeParse(value).success, value).toBe(false);
		}
	});

	test('accepts every current declarative database resource-id prefix', () => {
		for (const prefix of [
			'alppm',
			'alprm',
			'at',
			'audlog',
			'authep',
			'auther',
			'authp',
			'authr',
			'ca',
			'entfile',
			'entlab',
			'entsc',
			'evt',
			'file',
			'filec',
			'hrl',
			'kv',
			'lab',
			'log',
			'org',
			'set',
			'stori',
			'tpl',
			'user',
		]) {
			expect(ResourceIdSchema.parse(`${prefix}_00000000000000000000000000`)).toBe(
				`${prefix}_00000000000000000000000000`,
			);
		}
	});

	test('keeps every declared ResourceStatus value parseable', () => {
		for (const status of Object.values(ResourceStatus)) {
			expect(ResourceStatusSchema.parse(status)).toBe(status);
		}
		expect(ResourceStatusSchema.parse(ResourceStatus.Failed)).toBe(ResourceStatus.Failed);
	});

	test('redacts AnyResource passwords without changing ordinary fields', () => {
		const redact = buildRedactorFormSchema(AnyResourceSchema);
		const resource = {
			displayName: '公开名称',
			id: 'usr_01k856bpkm2rkhgqp7vwrfpq57',
			password: 'secret12',
		};

		expect(redact(resource)).toEqual({
			displayName: '公开名称',
			id: 'usr_01k856bpkm2rkhgqp7vwrfpq57',
			password: RedactedText,
		});
	});
});
