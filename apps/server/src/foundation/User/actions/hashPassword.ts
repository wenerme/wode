import { Errors } from '@wener/utils';

export async function hashPassword(password: string) {
	Errors.BadRequest.check(password, '密码不能为空');
	const { hash } = await import('bcryptjs');
	return hash(password, 10);
}
