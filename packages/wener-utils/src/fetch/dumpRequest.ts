import { isTextContentType } from './isTextContentType';

export async function dumpRequest({
	url,
	req,
	method,
	body,
	log = console.log,
	dumpBody: shouldDumpBody = true,
}: {
	url?: string;
	req?: RequestInit;
	method?: string;
	body?: any;
	log?: (s: string) => void;
	dumpBody?: boolean;
}) {
	const parts = ['->'];
	const requestMethod = method || req?.method;
	if (requestMethod) {
		parts.push(requestMethod);
	}
	if (url) {
		parts.push(url);
	}

	let out = `${parts.join(' ')}
${Array.from(new Headers(req?.headers).entries())
	.map(([k, v]) => `${k}: ${v}`)
	.join('\n')}
   `;

	const shouldTee = !body;
	body ??= req?.body;
	if (shouldDumpBody && body) {
		const contentType = new Headers(req?.headers).get('content-type') || '';

		if (shouldTee && req?.body instanceof ReadableStream) {
			const [previewStream, originalStream] = req.body.tee();
			req.body = originalStream;
			body = previewStream;
		}

		out += await dumpBodyContent({ body, contentType, canPreviewStream: shouldTee });
	}

	log(out);
	return out;
}

export async function dumpBodyContent({
	body,
	contentType,
	canPreviewStream = true,
}: {
	body?: any;
	contentType?: string;
	canPreviewStream?: boolean;
}): Promise<string> {
	if (!body) return '';

	if (contentType === 'application/octet-stream') {
		return `\n[Binary content not displayed: ${contentType}]\n`;
	} else if (body instanceof ReadableStream) {
		if (!canPreviewStream) {
			return `\n[ReadableStream - cannot preview external stream]\n`;
		}

		// Try to preview ReadableStream content safely
		try {
			const reader = body.getReader();
			let previewedBytes = 0;
			const maxPreviewSize = 1024; // 1KB preview limit
			let previewContent = '';
			let wasTruncated = false;

			while (previewedBytes < maxPreviewSize) {
				const { done, value } = await reader.read();
				if (done) break;

				if (value instanceof Uint8Array) {
					// Check if adding this chunk would exceed the limit
					if (previewedBytes + value.length > maxPreviewSize) {
						const remainingBytes = maxPreviewSize - previewedBytes;
						const truncatedValue = value.slice(0, remainingBytes);
						const decoded = new TextDecoder('utf-8', { fatal: false }).decode(truncatedValue);
						previewContent += decoded;
						wasTruncated = true;
						break;
					}

					const decoded = new TextDecoder('utf-8', { fatal: false }).decode(value);
					previewContent += decoded;
					previewedBytes += value.length;
				} else {
					const strValue = String(value);
					if (previewedBytes + strValue.length > maxPreviewSize) {
						const remainingChars = maxPreviewSize - previewedBytes;
						previewContent += strValue.slice(0, remainingChars);
						wasTruncated = true;
						break;
					}

					previewContent += strValue;
					previewedBytes += strValue.length;
				}
			}

			// If we exited the loop without hitting done, we were truncated
			if (!wasTruncated && previewedBytes >= maxPreviewSize) {
				wasTruncated = true;
			}

			let result = `\n${previewContent}`;
			if (wasTruncated) {
				result += `\n[... truncated]\n`;
			} else {
				result += `\n`;
			}

			reader.releaseLock();
			return result;
		} catch (error) {
			return `\n[Error reading stream: ${error}]\n`;
		}
	} else if (body instanceof FormData) {
		let result = `\n[FormData content]\n`;
		try {
			for (const [key, value] of body.entries()) {
				if (typeof value === 'string') {
					result += `${key}: ${value}\n`;
				} else {
					result += `${key}: [File: ${(value as File).name || 'unknown'}]\n`;
				}
			}
			return result;
		} catch (error) {
			return result + `[Error reading FormData: ${error}]\n`;
		}
	} else if (body instanceof URLSearchParams) {
		return `\n${body.toString()}\n`;
	} else if (isTextContentType(contentType || '') || typeof body === 'string') {
		try {
			const bodyContent = typeof body === 'string' ? body : String(body);
			return `\n${bodyContent}\n`;
		} catch (error) {
			return `\n[Error reading request body: ${error}]\n`;
		}
	} else {
		return `\n[Non-text content: ${typeof body}]\n`;
	}
}
