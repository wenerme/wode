export async function parseJsonResponse<T = any>(response: Response): Promise<T> {
	const contentType = response.headers.get('content-type');
	const text = await response.text();

	if (!text) {
		return null as any;
	}

	if (contentType?.includes('application/json')) {
		try {
			return JSON.parse(text);
		} catch (_e) {
			throw new Error(`Failed to parse JSON response: ${text}`);
		}
	}

	return text as any;
}
