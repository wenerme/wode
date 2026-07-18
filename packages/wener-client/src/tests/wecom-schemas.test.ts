import { describe, expect, test } from 'vite-plus/test';
import * as S from '../wecom/server/schema';

describe('wecom server schemas', () => {
	test('GeneralResponse parses', () => {
		expect(S.GeneralResponseSchema.parse({ errcode: 0, errmsg: 'ok' })).toEqual({ errcode: 0, errmsg: 'ok' });
	});

	test('CreateUserRequest validates', () => {
		const r = S.CreateUserRequestSchema.parse({ userid: 'test', name: '测试' });
		expect(r.userid).toBe('test');
	});

	test('schema count > 400', () => {
		const schemas = Object.keys(S).filter((k) => k.endsWith('Schema'));
		expect(schemas.length).toBeGreaterThan(400);
	});

	test('key schemas exist', () => {
		expect(S.CreateDepartmentRequestSchema).toBeDefined();
		expect(S.CreateMeetingRequestSchema).toBeDefined();
		expect(S.CreateDocRequestSchema).toBeDefined();
		expect(S.SendExmailRequestSchema).toBeDefined();
		expect(S.GetUserResponseSchema).toBeDefined();
	});
});
