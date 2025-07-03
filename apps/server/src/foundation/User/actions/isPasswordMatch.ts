import { validatePassword } from '@/foundation/User/actions/validatePassword';

export async function isPasswordMatch({ password, hash }: { password: string; hash?: string }) {
	const result = await validatePassword({ password, hash });
	return result.success;
}
