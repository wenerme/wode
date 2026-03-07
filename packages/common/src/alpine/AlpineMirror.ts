import type { FetchLike } from '@wener/utils';
import { getOfficialAlpineMirrorUrl } from './const';
import { joinUrl } from './joinUrl';
import { type RepositoryCoordinateInit, resolveRepositoryCoordinate } from './RepositoryCoordinate';
import { type ApkIndexPackage, parseApkIndex } from './repo/parseApkIndex';
import { type ApkIndexArchive, parseApkIndexArchive } from './repo/parseApkIndexArchive';

export function createAlpineMirror(
	mirrorUrl = getOfficialAlpineMirrorUrl(),
	{
		fetch = globalThis.fetch,
	}: {
		fetch?: FetchLike;
	} = {},
): AlpineMirror {
	const coordinate = resolveRepositoryCoordinate({ mirrorUrl });
	const request = async (path: string, _options: object = {}) => {
		let u = path;
		if (!/^https?:\//.test(u)) {
			u = joinUrl(coordinate.mirrorUrl, path);
		}
		const res = await fetch(u, {});
		if (!res.ok) {
			throw Object.assign(new Error(`${u}: ${res.statusText}`), { code: res.status, response: res });
		}
		return res;
	};
	return {
		get url() {
			return coordinate.mirrorUrl;
		},
		set url(v: string) {
			coordinate.mirrorUrl = v;
		},
		async getMirrors() {
			const txt = await (await request('MIRRORS.txt')).text();
			return txt.split('\n').filter(Boolean);
		},
		async getLastUpdated() {
			const res = await request('last-updated');
			let text = (await res.text()).trim();
			return +text;
		},

		getRepo(init: RepositoryCoordinateInit = {}) {
			const coord = resolveRepositoryCoordinate({
				...coordinate,
				...init,
			});
			return createAlpineRepo({ ...coord, mirror: this });
		},
	};
}

export type AlpineMirror = {
	url: string;
	getMirrors: () => Promise<string[]>;
	getLastUpdated: () => Promise<number>;
	getRepo: (options?: RepositoryCoordinateInit) => AlpineRepo;
};

export type AlpineRepo = {
	mirror: AlpineMirror;
	getIndex: (options?: RepositoryCoordinateInit) => Promise<{
		index: ApkIndexArchive;
		packages: ApkIndexPackage[];
	}>;
};

export function createAlpineRepo({
	mirror,
	..._coord
}: RepositoryCoordinateInit & {
	mirror?: AlpineMirror;
}): AlpineRepo {
	const coordinate = resolveRepositoryCoordinate(_coord);
	mirror ||= createAlpineMirror(coordinate.mirrorUrl);

	const request = async (path: string, _options: object = {}) => {
		let u = path;
		if (!/^https?:\//.test(u)) {
			u = joinUrl(coordinate.repoUrl, path);
		}
		const res = await fetch(u, {});
		if (!res.ok) {
			throw Object.assign(new Error(`${u}: ${res.statusText}`), { code: res.status, response: res });
		}
		return res;
	};

	return {
		mirror,
		async getIndex(options: RepositoryCoordinateInit = {}) {
			const { repoUrl } = resolveRepositoryCoordinate({
				...coordinate,
				...options,
			});
			const res = await request(joinUrl(repoUrl, 'APKINDEX.tar.gz'));
			const idx = await parseApkIndexArchive(await res.arrayBuffer());

			return {
				index: idx,
				packages: parseApkIndex(idx.apkindex),
			};
		},
	};
}
