const SensitiveKeyWords = new Set([
	'password',
	'passwd',
	'pwd',
	'passphrase',
	'secret',
	'secrets',
	'token',
	'tokens',
	'auth',
	'authorization',
	'credential',
	'credentials',
	'dsn',
	'dsns',
	'cookie',
	'cookies',
	'apikey',
	'apikeys',
	'accesskey',
	'secretkey',
	'privatekey',
	'signkey',
	'appkey',
	'sk',
	'connstr',
	'connectionstring',
]);
const SensitiveKeyPairs = new Set(
	[
		'api',
		'access',
		'private',
		'secret',
		'sign',
		'signing',
		'app',
		'encrypt',
		'encryption',
		'hmac',
		'jwt',
		'master',
	].flatMap((prefix) => [`${prefix}.key`, `${prefix}.keys`]),
);

export function normalizeKey(key: string): string {
	return key
		.replace(/([A-Z]+)([A-Z][a-z])/gu, '$1_$2')
		.replace(/([a-z\d])([A-Z])/gu, '$1_$2')
		.toLowerCase()
		.split(/[^a-z\d]+/u)
		.filter(Boolean)
		.join('.');
}

/** A bare key, releaseKey and tokenizer are ordinary names. */
export function isSensitiveKey(key: string): boolean {
	const words = normalizeKey(key).split('.');
	return (
		words.some((word) => SensitiveKeyWords.has(word)) ||
		words.some((word, index) => SensitiveKeyPairs.has(`${word}.${words[index + 1] ?? ''}`))
	);
}
