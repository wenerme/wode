export const GrafanaEnvNames = Object.freeze({
	__proto__: null,
	URL: 'GRAFANA_URL',
	SERVICE_ACCOUNT_TOKEN: 'GRAFANA_SERVICE_ACCOUNT_TOKEN',
	API_KEY: 'GRAFANA_API_KEY',
	ORG_ID: 'GRAFANA_ORG_ID',
	USERNAME: 'GRAFANA_USERNAME',
	PASSWORD: 'GRAFANA_PASSWORD',
	EXTRA_HEADERS: 'GRAFANA_EXTRA_HEADERS',
} as const);

export type GrafanaAuthOptions = {
	url?: string;
	serviceAccountToken?: string;
	orgId?: number;
	username?: string;
	password?: string;
	extraHeaders?: Record<string, string>;
	timeoutMs?: number;
	debug?: boolean;
};

export type ResolvedGrafanaAuthOptions = {
	url: string;
	serviceAccountToken?: string;
	orgId?: number;
	username?: string;
	password?: string;
	extraHeaders: Record<string, string>;
	timeoutMs: number;
	debug: boolean;
};

function parseOrgId(value: string | number | undefined) {
	if (value === undefined || value === null || value === '') return undefined;
	const parsed = typeof value === 'number' ? value : Number.parseInt(value, 10);
	return Number.isFinite(parsed) ? parsed : undefined;
}

function parseExtraHeaders(value: string | undefined) {
	if (!value) return {};
	try {
		const parsed = JSON.parse(value);
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
		return Object.fromEntries(
			Object.entries(parsed).flatMap(([key, entryValue]) => {
				if (typeof entryValue !== 'string') return [];
				return [[key, entryValue] as const];
			}),
		);
	} catch {
		return {};
	}
}

export function resolveGrafanaAuthOptions(options: GrafanaAuthOptions): ResolvedGrafanaAuthOptions {
	const url = (options.url || process.env[GrafanaEnvNames.URL] || '').trim().replace(/\/+$/, '');
	if (!url) {
		throw new Error(`Missing Grafana URL. Set ${GrafanaEnvNames.URL} or provide options.url`);
	}

	const serviceAccountToken =
		options.serviceAccountToken ||
		process.env[GrafanaEnvNames.SERVICE_ACCOUNT_TOKEN] ||
		process.env[GrafanaEnvNames.API_KEY] ||
		undefined;

	const username = options.username || process.env[GrafanaEnvNames.USERNAME] || undefined;
	const password = options.password || process.env[GrafanaEnvNames.PASSWORD] || undefined;
	const orgId = parseOrgId(options.orgId ?? process.env[GrafanaEnvNames.ORG_ID]);
	const timeoutMs = options.timeoutMs && options.timeoutMs > 0 ? options.timeoutMs : 15_000;

	return {
		url,
		serviceAccountToken,
		orgId,
		username,
		password,
		extraHeaders: {
			...parseExtraHeaders(process.env[GrafanaEnvNames.EXTRA_HEADERS]),
			...(options.extraHeaders ?? {}),
		},
		timeoutMs,
		debug: Boolean(options.debug),
	};
}

export function buildGrafanaHeaders(options: ResolvedGrafanaAuthOptions, headers?: HeadersInit, contentType?: string) {
	const requestHeaders = new Headers(options.extraHeaders);
	requestHeaders.set('Accept', 'application/json');

	if (options.serviceAccountToken) {
		requestHeaders.set('Authorization', `Bearer ${options.serviceAccountToken}`);
	} else if (options.username) {
		requestHeaders.set(
			'Authorization',
			`Basic ${Buffer.from(`${options.username}:${options.password ?? ''}`).toString('base64')}`,
		);
	}

	if (options.orgId !== undefined) {
		requestHeaders.set('X-Grafana-Org-Id', String(options.orgId));
	}

	if (headers) {
		for (const [key, value] of new Headers(headers).entries()) {
			requestHeaders.set(key, value);
		}
	}

	if (contentType) {
		requestHeaders.set('Content-Type', contentType);
	}

	return requestHeaders;
}
