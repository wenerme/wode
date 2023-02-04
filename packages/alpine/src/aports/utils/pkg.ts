export function parsePackageId(id: string) {
  // https://regex101.com/r/koppmX/2
  const { branch, repo, pkg, ver } =
    /^((?<branch>edge)[/])?(?<repo>community|main|testing)[/](?<pkg>[^/\s]+)([/](?<ver>[0-9._-]+))?$/.exec(id)
      ?.groups || {};
  if (!repo && !pkg) {
    return undefined;
  }
  return {
    path: `${repo}/${pkg}`,
    branch,
    repo,
    pkg,
    ver,
  };
}

export interface ParsedPackageId {
  path: string;
  branch?: string;
  repo?: string;
  pkg?: string;
  ver?: string;
}
