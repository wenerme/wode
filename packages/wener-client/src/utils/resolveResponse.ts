import { isTextContentType } from './isTextContentType';

export interface ResolvedResponse<T = any> {
	data?: T;
	text?: string;
	blob?: Blob;
	ok: boolean;
	status: number;
	statusText: string;
	headers: Headers;
	error?: Error;
}

/**
 * Resolves a Response object into a standardized format with automatic content parsing
 */
export async function resolveResponse<T = any>(response: Response): Promise<ResolvedResponse<T>> {
	const contentType = response.headers.get('content-type') || '';

	let data: T | undefined;
	let text: string | undefined;
	let blob: Blob | undefined;
	let error: Error | undefined;

	// Create error for non-OK responses
	if (!response.ok) {
		error = Object.assign(new Error(`HTTP ${response.status}: ${response.statusText}`), {
			status: response.status,
			statusText: response.statusText,
			response,
		});
	}

	// Handle different content types
	if (isTextContentType(contentType)) {
		// Text-based content
		text = await response.text();

		if (contentType.includes('application/json') && text) {
			try {
				data = JSON.parse(text) as T;
			} catch (e) {
				// If JSON parsing fails, keep the text and add parsing error
				if (!error) {
					error = Object.assign(new Error(`Failed to parse JSON response`), {
						status: response.status,
						statusText: response.statusText,
						parseError: e,
						responseText: text,
					});
				}
			}
		} else if (contentType.includes('application/xml') || contentType.includes('text/xml')) {
			// For XML, just return as text - let consumer parse if needed
			data = text as any;
		} else {
			// Other text types
			data = text as any;
		}
	} else if (response.headers.get('content-length') === '0') {
		// Empty response
		data = null as any;
	} else {
		// Binary content - return as blob
		blob = await response.blob();
		data = blob as any;
	}

	return {
		data,
		text,
		blob,
		ok: response.ok,
		status: response.status,
		statusText: response.statusText,
		headers: response.headers,
		error,
	};
}
