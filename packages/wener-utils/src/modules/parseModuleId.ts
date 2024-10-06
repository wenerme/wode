// https://regex101.com/r/eMcXQ9/1
const regModuleId =
  /^(?<n>(?:@(?<org>[a-z0-9-~][a-z0-9-._~]*)\/)?(?<pkg>[a-z0-9-~][a-z0-9-._~]*))(?:@(?<v>[-a-z0-9><=_.^~]+))?(?<p>\/[^\r\n]*)?$/;

export type ParsedModuleId = {
  id: string; // name@version
  name: string; // @org/pkg, pkg
  version?: string; // 1.1.1
  range: string; // version, tag, range
  pkg: string;
  path?: string;
  org?: string;
  versioned: boolean; // is module id contain a version specifier
} & (
  | { scoped: false }
  | {
      scoped: true;
      org: string;
    }
);

/**
 * Parse NPM module id
 *
 * @example
 * parseModuleId('@wener/reaction@latest/index.js')
 * // { id: '@wener/reaction@latest', name: '@wener/reaction', version: 'latest', range: 'latest', pkg: 'reaction', path: '/index.js', scoped: true, org: 'wener' }
 */
export function parseModuleId(s: string): ParsedModuleId | undefined {
  const groups = s.match(regModuleId)?.groups;
  if (!groups) {
    return undefined;
  }
  const { n: name, v: version, p: path, org, pkg } = groups;
  const scoped = Boolean(org);
  const v = /^\d+\.\d+\.\d+/.test(version) ? version : undefined;
  const range = version || 'latest';
  const o: ParsedModuleId = {
    id: `${name}@${range}`,
    name,
    range,
    scoped,
    pkg,
    org,
    versioned: Boolean(version),
  };
  if (v) {
    o.version = v;
  }
  if (path) {
    o.path = path;
  }
  if (!o.scoped) {
    delete o.org;
  }
  return o;
}
