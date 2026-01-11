// https://github.com/LiosK/uuidv7/blob/main/src/index.ts
// https://www.rfc-editor.org/rfc/rfc9562.html#name-uuid-version-7

import { getRandomValues } from '../web/getRandomValues';

/**
 * Generate a UUIDv7 string
 *
 * UUIDv7 format (RFC 9562):
 * - 48 bits: Unix timestamp in milliseconds
 * - 4 bits: version (7)
 * - 12 bits: random (rand_a)
 * - 2 bits: variant (10)
 * - 62 bits: random (rand_b)
 *
 * Format: xxxxxxxx-xxxx-7xxx-yxxx-xxxxxxxxxxxx
 * where y is 8, 9, a, or b (variant bits)
 */
export function randomUUIDv7(timestamp?: number): string {
	const ts = timestamp ?? Date.now();
	const bytes = new Uint8Array(16);
	getRandomValues(bytes);

	// timestamp (48 bits)
	bytes[0] = (ts / 2 ** 40) & 0xff;
	bytes[1] = (ts / 2 ** 32) & 0xff;
	bytes[2] = (ts / 2 ** 24) & 0xff;
	bytes[3] = (ts / 2 ** 16) & 0xff;
	bytes[4] = (ts / 2 ** 8) & 0xff;
	bytes[5] = ts & 0xff;

	// version (4 bits) = 7
	bytes[6] = (bytes[6] & 0x0f) | 0x70;

	// variant (2 bits) = 10
	bytes[8] = (bytes[8] & 0x3f) | 0x80;

	return formatUUID(bytes);
}

function formatUUID(bytes: Uint8Array): string {
	const hex = Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Extract timestamp from UUIDv7
 */
export function parseUUIDv7Timestamp(uuid: string): number {
	const hex = uuid.replace(/-/g, '');
	if (hex.length !== 32) {
		throw new Error('Invalid UUID format');
	}
	const tsHex = hex.slice(0, 12);
	return parseInt(tsHex, 16);
}

/**
 * Check if a string is a valid UUIDv7
 */
export function isUUIDv7(uuid: string | null | undefined): boolean {
	if (!uuid) return false;
	const match = uuid.match(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
	return match !== null;
}

export interface CreateRandomUUIDv7Options {
	now?: () => number;
}

/**
 * Create a UUIDv7 generator with custom options
 */
export function createRandomUUIDv7({ now = Date.now }: CreateRandomUUIDv7Options = {}) {
	return function uuidv7(timestamp?: number): string {
		return randomUUIDv7(timestamp ?? now());
	};
}
