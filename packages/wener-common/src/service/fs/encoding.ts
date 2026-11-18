/** Input rejected by the filesystem service layer itself; safe to surface to callers. */
export class FsInputError extends TypeError {
	override name = 'FsInputError';
}

/** Browser-safe Base64 helpers for bounded filesystem content; no Node Buffer. */
export function encodeFsBase64(bytes: Uint8Array): string {
	const parts: string[] = [];
	for (let i = 0; i < bytes.byteLength; i += 8192) parts.push(String.fromCharCode(...bytes.subarray(i, i + 8192)));
	return btoa(parts.join(''));
}

export function decodeFsBase64(value: string): Uint8Array {
	try {
		const binary = atob(value);
		if (btoa(binary) !== value.replace(/=+$/u, '').padEnd(Math.ceil(value.replace(/=+$/u, '').length / 4) * 4, '='))
			throw new Error();
		return Uint8Array.from(binary, (char) => char.charCodeAt(0));
	} catch {
		throw new FsInputError('Invalid Base64 content');
	}
}
