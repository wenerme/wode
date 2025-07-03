import { Password } from '@wener/common/password';
import { md5 } from '@wener/utils';

export async function validatePassword({
	password,
	hash,
}: {
	password: string;
	hash?: string;
}): Promise<ValidateResult> {
	let out: ValidateResult = {
		success: false,
	};
	if (!hash || !password) {
	} else if (hash.startsWith('$')) {
		// assume PHC
		const result = await Password.validate(password, hash);
		return {
			success: result.result,
			algorithm: result.parsed.id,
		};
	} else if (isMd5(hash)) {
		out = {
			success: md5(password) === hash,
			algorithm: 'md5',
		};
	} else if (password === hash) {
		out = {
			success: true,
			algorithm: 'plain',
		};
	}

	if (!out.success) {
		console.error(`Invalid password hash=${JSON.stringify(hash)} password=${JSON.stringify(password)}`);
	}

	return out;
}

type ValidateResult = {
	success: boolean;
	algorithm?: string;
};

function isMd5(s: string) {
	return s.length === 32 && /^[a-f0-9]{32}$/.test(s);
}
