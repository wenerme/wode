import type { ParsedS3Options } from './parseS3Url';

function isValidBucketName(bucket: string): boolean {
	const bucketRegex = /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/;
	return bucketRegex.test(bucket) && !bucket.includes('..') && !bucket.includes('.-') && !bucket.includes('-.');
}

export function formatS3Url(
	o: ParsedS3Options,
	{
		credentials,
		useParams,
	}: {
		credentials?: boolean;
		useParams?: boolean;
	} = {},
): string {
	if (!o || typeof o !== 'object') {
		throw new Error('S3 options must be an object');
	}

	if (!o.endpoint) {
		throw new Error('Endpoint is required');
	}

	let url: URL;
	let ep = o.endpoint || 's3.amazonaws.com';
	try {
		if (URL.canParse(ep)) {
			url = new URL(ep);
		} else {
			url = new URL(`https://${ep}`);
		}
	} catch (_error) {
		throw new Error(`Invalid endpoint: ${ep}`);
	}

	const { useSsl = true, region, pathStyle, port, accessKeyId, secretAccessKey, bucket } = o;
	url.protocol = useSsl ? 'https:' : 'http:';

	if (credentials) {
		if (accessKeyId && secretAccessKey) {
			url.username = encodeURIComponent(accessKeyId);
			url.password = encodeURIComponent(secretAccessKey);
		} else {
			throw new Error('Access Key ID and Secret Access Key are required for credentials');
		}
	}

	if (useParams) {
		if (region) {
			url.searchParams.set('region', region);
		}
		if (pathStyle !== undefined) {
			url.searchParams.set('pathStyle', String(pathStyle));
		}
	}

	if (port) {
		const portNum = Number(port);
		if (Number.isNaN(portNum) || portNum < 1 || portNum > 65535) {
			throw new Error('Port must be a valid number between 1 and 65535');
		}
		url.port = String(portNum);
	}

	if (bucket) {
		if (!isValidBucketName(bucket)) {
			throw new Error(`Invalid bucket name: ${bucket}`);
		}

		if (pathStyle) {
			url.pathname = `/${bucket}${url.pathname}`;
		} else {
			// Check if bucket is already in hostname (virtual-hosted style)
			const bucketPattern = new RegExp(`^${bucket.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.`);
			if (!bucketPattern.test(url.hostname)) {
				url.hostname = `${bucket}.${url.hostname}`;
			}
		}
	}

	return url.toString();
}
