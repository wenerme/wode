import { ArrayBuffers, firstOfMaybeArray } from '@wener/utils';
import { parse as parseCookie } from 'cookie';

type ResolvedRequestToken = {
	in: 'header' | 'query' | 'cookie';
} & ParsedAuthorization;

type RequestLike = {
	url?: string;
	header?: Headers | Record<string, any>;
	headers?: Headers | Record<string, any>;
	query?: Record<string, any>;
};

export function resolveRequestToken({
	url,
	header,
	headers = header,
	query,
}: RequestLike): ResolvedRequestToken | undefined {
	const getHeader = (name: string): string | undefined => {
		if (headers instanceof Headers) {
			return headers.get(name) || undefined;
		} else if (headers) {
			return firstOfMaybeArray(headers[name]);
		}
	};
	if (headers) {
		{
			let auth = getHeader('authorization');
			let parsed = parseAuthorization(auth);
			if (parsed) {
				return {
					...parsed,
					in: 'header',
				};
			}
		}
		{
			let cookie = getHeader('cookie');
			if (cookie) {
				const { token, accessToken = token } = parseCookie(cookie);
				if (accessToken) {
					return {
						token: accessToken,
						type: 'cookie',
						in: 'cookie',
					};
				}
			}
		}
	}
	if (query) {
		if (url) {
			query = Object.fromEntries(new URL(url, 'http://localhost').searchParams.entries());
		}
	}
	if (query) {
		let token = firstOfMaybeArray(query.token);
		if (token) {
			return {
				token,
				in: 'query',
			};
		}
	}
}

type ParsedAuthorization = {
	type?: string;
	token: string;
	username?: string;
	password?: string;
	bearer?: string;
};

function parseAuthorization(auth: string | undefined | null): ParsedAuthorization | undefined {
	if (!auth) {
		return;
	}
	const [type, token] = auth.trim().split(/\s+/, 2) ?? [];
	if (!token) {
		return;
	}
	let out: ParsedAuthorization = {
		type,
		token,
	};

	switch (type?.toLowerCase()) {
		case 'basic': {
			try {
				let [username, password] = ArrayBuffers.toString(ArrayBuffers.fromBase64(token), 'utf-8').split(':', 2);
				out.username = username;
				out.password = password;
			} catch (e) {
				// ignore
			}
			break;
		}
		case 'bearer':
			out.bearer = token;
			break;
	}

	return out;
}
