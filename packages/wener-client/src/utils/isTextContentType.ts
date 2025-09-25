/**
 * Check if content type is text-based (can be read as string)
 */
export function isTextContentType(contentType: string): boolean {
	if (!contentType) return false;

	const textTypes = [
		'text/',
		'application/json',
		'application/xml',
		'application/javascript',
		'application/x-www-form-urlencoded',
		'+json',
		'+xml',
	];

	return textTypes.some((type) => contentType.includes(type));
}
