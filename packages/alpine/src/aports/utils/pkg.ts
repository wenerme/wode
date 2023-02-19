export function parsePackageId(id: string, loose?: boolean) {
  // https://regex101.com/r/koppmX/3
  const { branch, repo, pkg, ver } =
    /^((?<branch>edge|\d[.]\d{1,2})[/])?((?<repo>community|main|testing)[/])?(?<pkg>[^/\s]+)([/](?<ver>[0-9._-]+))?$/.exec(
      id,
    )?.groups || {};
  if (!pkg) {
    return undefined;
  }
  if (!loose && !repo) {
    return undefined;
  }
  return {
    path: repo ? `${repo}/${pkg}` : undefined,
    branch,
    repo,
    pkg,
    ver,
  };
}

export interface ParsedPackageId {
  path: string;
  branch?: string;
  repo: string;
  pkg: string;
  ver?: string;
}

export interface ParsedPackageIdLoose {
  path?: string;
  branch?: string;
  repo?: string;
  pkg: string;
  ver?: string;
}
