import { AlpineChannelType, getLatestAlpineBranch, getOfficialAlpineMirrorUrl } from './const';
import { joinUrl } from './joinUrl';

export type RepositoryCoordinateInit = {
	mirrorUrl?: string;
	arch?: string;
	branch?: string;
	channel?: string;
};
type RepositoryCoordinate = {
	mirrorUrl: string;
	repoUrl: string;
	repoPath: string;
	arch: string;
	branch: string;
	channel: string;
};

export type PackageCoordinateInit = RepositoryCoordinateInit & {
	pkg: string;
	version: string;
};
export type PackageCoordinate = RepositoryCoordinate & {
	packageUrl: string;
	pkg: string;
	version: string;
	filename: string;
};

export function resolvePackageCoordinate(coordinate: PackageCoordinateInit): PackageCoordinate {
	const repo = resolveRepositoryCoordinate(coordinate);
	const { pkg, version } = coordinate;
	const filename = `${pkg}-${version}.apk`;
	const packageUrl = joinUrl(repo.repoUrl, '');
	return {
		...repo,
		packageUrl,
		pkg,
		version,
		filename,
	};
}

export function resolveRepositoryCoordinate({
	mirrorUrl,
	arch,
	branch,
	channel,
}: RepositoryCoordinateInit): RepositoryCoordinate {
	mirrorUrl ||= getOfficialAlpineMirrorUrl();
	branch ||= getLatestAlpineBranch();
	arch ||= 'x86_64';
	channel ||= AlpineChannelType.main;
	const repoPath = `${branch}/${channel}/${arch}/`;
	const repoUrl = joinUrl(mirrorUrl, repoPath);
	return {
		mirrorUrl,
		repoUrl,
		arch,
		branch,
		channel,
		repoPath,
	};
}
