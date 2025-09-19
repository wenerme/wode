/**
 * Check if the content type represents text content that can be safely displayed
 */
export function isTextContentType(contentType: string): boolean {
	return (
		contentType.includes('application/json')
		|| contentType.includes('text/')
		|| contentType.includes('application/xml')
		|| contentType.includes('application/javascript')
		|| contentType.includes('application/x-www-form-urlencoded')
	);
}
