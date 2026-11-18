export type FsUrlKind = 'local' | 's3' | 'webdav';

export interface FsUrlCredentials {
	username: string;
	password: string;
}

export type ParsedFsUrl =
	| { kind: 'local'; root: string }
	| {
			kind: 's3';
			/** Endpoint origin without credentials, e.g. `https://s3.example.test`. */
			endpoint: string;
			bucket: string;
			/** Key prefix inside the bucket without leading/trailing slashes. */
			prefix: string;
			region?: string;
			credentials?: FsUrlCredentials;
	  }
	| {
			kind: 'webdav';
			/** http(s) base collection URL without credentials. */
			url: string;
			credentials?: FsUrlCredentials;
	  };

export class FsUrlError extends Error {
	override name = 'FsUrlError';
}

const SchemeRe = /^([a-z][a-z0-9+.-]*):\/\//iu;

/** Replace any URL userinfo with `***`; never throws. */
export function redactFsUrl(value: string): string {
	return String(value).replace(/^([a-z][a-z0-9+.-]*:\/\/)[^/?#@]*@/iu, '$1***@');
}

function credentialsOf(url: URL): FsUrlCredentials | undefined {
	if (!url.username && !url.password) return undefined;
	try {
		return { username: decodeURIComponent(url.username), password: decodeURIComponent(url.password) };
	} catch {
		throw new FsUrlError('Invalid filesystem URL credentials');
	}
}

function parseUrl(value: string): URL {
	try {
		return new URL(value);
	} catch {
		// Never echo the input: it may contain credentials.
		throw new FsUrlError('Invalid filesystem URL');
	}
}

/**
 * Resolve a filesystem URL:
 * - `file:///abs/path` or a bare path -> local
 * - `s3://[key:secret@]host[:port]/bucket/prefix?region=` (`s3+http://` for plain HTTP) -> S3, path-style
 * - `webdav://` (http), `webdavs://` (https), `http(s)://` -> WebDAV
 *
 * Credentials embedded in the URL are split out and never kept in returned URLs or errors.
 */
export function parseFsUrl(value: string): ParsedFsUrl {
	if (typeof value !== 'string' || !value.trim() || value.includes('\0')) throw new FsUrlError('Filesystem URL is required');
	const input = value.trim();
	const scheme = SchemeRe.exec(input)?.[1]?.toLowerCase();
	if (!scheme) return { kind: 'local', root: input };
	switch (scheme) {
		case 'file': {
			const url = parseUrl(input);
			if (url.host && url.host !== 'localhost') throw new FsUrlError('file URL must not have a remote host');
			let root: string;
			try {
				root = decodeURIComponent(url.pathname);
			} catch {
				throw new FsUrlError('Invalid filesystem URL');
			}
			return { kind: 'local', root: root || '/' };
		}
		case 's3':
		case 's3+http':
		case 's3+https': {
			const url = parseUrl(input.replace(SchemeRe, scheme === 's3+http' ? 'http://' : 'https://'));
			const credentials = credentialsOf(url);
			const [bucket, ...rest] = url.pathname.split('/').filter(Boolean);
			if (!bucket) throw new FsUrlError('S3 filesystem URL requires a bucket');
			const region = url.searchParams.get('region') || undefined;
			return {
				kind: 's3',
				endpoint: url.origin,
				bucket: decodeURIComponent(bucket),
				prefix: rest.map(decodeURIComponent).join('/'),
				...(region ? { region } : {}),
				...(credentials ? { credentials } : {}),
			};
		}
		case 'webdav':
		case 'webdavs':
		case 'http':
		case 'https': {
			const protocol = scheme === 'webdav' || scheme === 'http' ? 'http://' : 'https://';
			const url = parseUrl(input.replace(SchemeRe, protocol));
			const credentials = credentialsOf(url);
			url.username = '';
			url.password = '';
			url.hash = '';
			return { kind: 'webdav', url: url.toString(), ...(credentials ? { credentials } : {}) };
		}
		default:
			throw new FsUrlError(`Unsupported filesystem URL scheme: ${scheme}`);
	}
}
