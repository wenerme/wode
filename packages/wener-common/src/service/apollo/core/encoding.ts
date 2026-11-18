/** Encodes UTF-8 bytes rather than UTF-16 code units, including non-ASCII credentials and item keys. */
export function encodeApolloUtf8Base64(value: string): string {
	const bytes = new TextEncoder().encode(value);
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary);
}
