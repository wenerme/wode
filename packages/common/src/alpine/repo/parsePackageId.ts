export function parsePackageId(id: string, loose?: boolean): ParsedPackageId | undefined {
	// https://regex101.com/r/koppmX/3
	const { branch, repo, pkg, version } =
		/^((?<branch>edge|latest-stable|\d[.]\d{1,2})[/])?((?<repo>community|main|testing)[/])?(?<pkg>[^/\s]+)([/](?<version>[0-9._-]+))?$/.exec(
			id,
		)?.groups || {};
	if (!pkg) {
		return undefined;
	}
	if (!loose && !repo) {
		return undefined;
	}
	return { path: repo ? `${repo}/${pkg}` : undefined, branch, repo, pkg, version };
}

export interface ParsedPackageId {
	path?: string; // `repo/pkg`
	branch?: string; // branch like edge, 3.16
	repo?: string; // repo name like community, main, testing
	pkg: string; // package name
	version?: string; // version
}
