import { isTextContentType } from './isTextContentType';

export async function dumpResponse({
	res,
	url,
	req,
	method,
	log = console.log,
	dumpBody = true,
	clone = dumpBody,
}: {
	res: Response;
	url?: string;
	req?: RequestInit;
	method?: string;
	log?: (s: string) => void;
	dumpBody?: boolean;
	clone?: boolean;
}) {
	const shouldClone = clone || dumpBody;
	const responseToProcess = shouldClone ? res.clone() : res;

	const parts = [`<- ${res.status} ${res.statusText}`];
	const requestMethod = method || req?.method;
	if (requestMethod) {
		parts.push(requestMethod);
	}
	if (url) {
		parts.push(url);
	}

	let out = `${parts.join(' ')}
${Array.from(res.headers.entries())
	.map(([k, v]) => `${k}: ${v}`)
	.join('\n')}
   `;

	if (dumpBody) {
		const ct = res.headers.get('content-type') || '';

		if (isTextContentType(ct)) {
			try {
				const responseBody = await responseToProcess.text();
				out += `\n${responseBody}\n`;
			} catch (error) {
				out += `\n[Error reading response body: ${error}]\n`;
			}
		} else {
			out += `\n[Binary content not displayed: ${ct}]\n`;
		}
	}

	log(out);

	return res;
}
