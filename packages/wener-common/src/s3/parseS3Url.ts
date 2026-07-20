import { parseBoolean } from '@wener/utils';

export type ParsedS3Options = {
	accessKeyId?: string;
	secretAccessKey?: string;
	region?: string;
	useSsl?: boolean;
	bucket?: string;
	endpoint: string;
	port?: number;
	pathStyle?: boolean;
	url?: string;
};

export type ParseS3UrlOptions = Partial<ParsedS3Options>;

function isValidIpAddress(hostname: string): boolean {
	const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
	const ipv6Regex = /^\[([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}]$/;
	return ipv4Regex.test(hostname) || ipv6Regex.test(hostname);
}

export function parseS3Url({ url = process.env.S3_URL, ...rest }: ParseS3UrlOptions = {}): ParsedS3Options | undefined {
	if (!url) return undefined;

	const normalizedUrl = url.startsWith('s3://') ? url.replace(/^s3:\/\//, 'https://') : url;
	let parsed: URL;
	try {
		parsed = new URL(normalizedUrl);
	} catch (_error) {
		throw new Error(`Invalid S3 URL: ${url}`);
	}

	const pathStyleParam = parsed.searchParams.get('pathStyle');
	let pathStyle: boolean | undefined = rest.pathStyle;
	pathStyle ??= parseBoolean(pathStyleParam, true);

	// Auto-detect path style for IP addresses
	if (pathStyle === undefined && isValidIpAddress(parsed.hostname)) {
		pathStyle = true;
	}

	const result: ParsedS3Options = {
		accessKeyId: parsed.username || undefined,
		secretAccessKey: parsed.password || undefined,
		endpoint: parsed.hostname,
		port: parsed.port ? Number(parsed.port) : undefined,
		useSsl: parsed.protocol === 'https:',
		region: parsed.searchParams.get('region') || undefined,
		pathStyle,
	};

	if (!result.port) {
		if (result.useSsl) {
			result.port = 443;
		} else {
			result.port = 80;
		}
	}

	const pathSegments = parsed.pathname.split('/').filter(Boolean);
	const awsVirtualHostMatch = parsed.hostname.match(/^(.*?)\.s3[.-]([a-z0-9-]+)?\.?amazonaws\.com$/);

	if (result.pathStyle) {
		result.bucket = pathSegments[0];
	} else if (awsVirtualHostMatch) {
		result.bucket = awsVirtualHostMatch[1];
		result.endpoint = parsed.hostname;
		if (!result.region && awsVirtualHostMatch[2]) {
			result.region = awsVirtualHostMatch[2];
		}
		result.pathStyle = false;
	} else {
		result.bucket = pathSegments[0];
		if (result.pathStyle === undefined) {
			result.pathStyle = true;
		}
	}

	// Type-safe property assignment
	for (const [key, value] of Object.entries(rest)) {
		if (value !== undefined && value !== null && key in result) {
			(result as Record<string, unknown>)[key] = value;
		}
	}

	return result;
}
