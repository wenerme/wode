import { GoogleAnalyticsClientError } from './errors';

export const GoogleOAuthTokenUrl = 'https://oauth2.googleapis.com/token';
export const GoogleAnalyticsReadOnlyScope = 'https://www.googleapis.com/auth/analytics.readonly';

/** Subset of a Google service-account key JSON needed for the JWT bearer flow. */
export interface GoogleServiceAccountKey {
	client_email: string;
	private_key: string;
	token_uri?: string;
}

export type GoogleAnalyticsCredential = { accessToken: string } | { serviceAccount: GoogleServiceAccountKey };

export interface GoogleAccessToken {
	accessToken: string;
	/** Epoch milliseconds. */
	expiresAt: number;
}

function base64Url(bytes: Uint8Array): string {
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replace(/\+/gu, '-').replace(/\//gu, '_').replace(/=+$/u, '');
}

function base64UrlJson(value: unknown): string {
	return base64Url(new TextEncoder().encode(JSON.stringify(value)));
}

function pemToPkcs8(pem: string): ArrayBuffer {
	const body = pem
		.replace(/-----BEGIN PRIVATE KEY-----/u, '')
		.replace(/-----END PRIVATE KEY-----/u, '')
		.replace(/\\n/gu, '')
		.replace(/\s+/gu, '');
	if (!body || !/^[A-Za-z0-9+/]+=*$/u.test(body)) throw new Error('invalid key');
	const binary = atob(body);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes.buffer;
}

/** Parse and validate a service-account key; errors never include key material. */
export function parseGoogleServiceAccountKey(value: unknown): GoogleServiceAccountKey {
	let parsed = value;
	if (typeof value === 'string') {
		try {
			parsed = JSON.parse(value);
		} catch {
			throw new GoogleAnalyticsClientError('INVALID_CONFIG', 'Google service account credentials are invalid');
		}
	}
	const record = parsed as Partial<GoogleServiceAccountKey> | null;
	if (
		!record ||
		typeof record !== 'object' ||
		typeof record.client_email !== 'string' ||
		!record.client_email ||
		typeof record.private_key !== 'string' ||
		!record.private_key.includes('PRIVATE KEY') ||
		(record.token_uri !== undefined && typeof record.token_uri !== 'string')
	)
		throw new GoogleAnalyticsClientError('INVALID_CONFIG', 'Google service account credentials are invalid');
	return { client_email: record.client_email, private_key: record.private_key, token_uri: record.token_uri };
}

/** Build an RS256-signed JWT assertion with Web Crypto (browser and Node >= 20). */
export async function createGoogleServiceAccountAssertion(
	key: GoogleServiceAccountKey,
	{ scope = GoogleAnalyticsReadOnlyScope, now = Date.now() }: { scope?: string; now?: number } = {},
): Promise<string> {
	const subtle = globalThis.crypto?.subtle;
	if (!subtle) throw new GoogleAnalyticsClientError('INVALID_CONFIG', 'Web Crypto is not available');
	let cryptoKey: CryptoKey;
	try {
		cryptoKey = await subtle.importKey('pkcs8', pemToPkcs8(key.private_key), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
	} catch {
		throw new GoogleAnalyticsClientError('INVALID_CONFIG', 'Google service account credentials are invalid');
	}
	const iat = Math.floor(now / 1000);
	const unsigned = `${base64UrlJson({ alg: 'RS256', typ: 'JWT' })}.${base64UrlJson({
		iss: key.client_email,
		scope,
		aud: key.token_uri ?? GoogleOAuthTokenUrl,
		iat,
		exp: iat + 3600,
	})}`;
	const signature = await subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(unsigned));
	return `${unsigned}.${base64Url(new Uint8Array(signature))}`;
}
