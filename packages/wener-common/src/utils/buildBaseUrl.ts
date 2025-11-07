function joinUrl(baseUrl: string, maybeUrl: string): string {
	const sanitizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
	const sanitizedEndpoint = maybeUrl.startsWith('/') ? maybeUrl.slice(1) : maybeUrl;
	return `${sanitizedBase}/${sanitizedEndpoint}`;
}

export function buildBaseUrl(url: string, baseUrl: string | undefined | null): string {
	if (!baseUrl || /^https?:/.test(url)) {
		return url;
	}
	return joinUrl(baseUrl, url);
}
