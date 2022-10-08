import { Logger, parseModuleId } from '@wener/utils';
import { Unpkg } from './Unpkg';
import { getContentType } from './mime';

export interface CreateUnpkgHandlerOptions {
  unpkg: Unpkg;
  prefix?: string;
  logger?: Logger;
}

export function createUnpkgHandler({
  unpkg,
  logger = console,
  prefix = '',
}: CreateUnpkgHandlerOptions): (r: { path: string }) => Promise<{ status: number; headers: any; body?: any }> {
  /*
package registry meta
@org/pkg
pkg

package meta
@org/pkg@version
pkg@version
Resolved version redirect
@org/pkg@latest -> @org/pkg@1.0.0
pkg@latest -> pkg@1.0.0

NPM
pkg
pkg/version
pkg/version/-/pkg-version.tgz

file
@org/pkg@version/path
@org/pkg/path -> @org/pkg@version/path
pkg@version/path
pkg/path -> pkg@version/path

tar
@org/pkg/-/pkg-version.tgz
pkg/-/pkg-version.tgz

*/

  return async ({ path: requestPath }) => {
    const parsed = parseModuleId(requestPath);
    if (!parsed) {
      throw Object.assign(new Error('invalid module id'), { status: 400 });
    }
    let { id, name, version: ver, path: file = '', versioned } = parsed;
    if (!versioned && !file) {
      // list
      return {
        status: 200,
        headers: {},
        body: await unpkg.getPackageInfo(name),
      };
    }
    let versionPath = false;
    if (!versioned) {
      // npm pattern
      // pkg/version
      const segments = file.split('/');
      const firstSegment = segments[0];
      if (isVersion(firstSegment)) {
        file = file.substring(firstSegment.length + 1);
        ver = firstSegment;
        id = `${name}@${ver}`;
        versionPath = true;
      }
      // todo detect
      // /-/name-version.tgz
    }
    const meta = await unpkg.getPackageVersionInfo(id);
    if (meta.version !== ver) {
      logger.debug(`version redirect '${ver}' -> '${meta.version}'`);
      return {
        status: 302,
        headers: {
          'Cache-Tag': `redirect, semver-redirect`,
          'Cache-Control': 'public, s-maxage=600, max-age=60',
          Location: versionPath
            ? `${prefix}/${name}/${meta.version}${file || ''}`
            : `${prefix}/${meta._id}/${file || ''}`,
        },
      };
    }
    id = meta._id;

    // file resolve ?
    if (!file || file === '/' || file === '/package.json') {
      return {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'public, max-age=31536000', // 1y
          'Cache-Tag': 'package.json',
        },
        body: meta,
      };
    }

    logger.debug(`unpkg file: ${id} -> ${file}`);
    const content = await unpkg.getPackageFile(`${id}${file}`);

    return {
      status: 200,
      headers: {
        'Content-Type': getContentType(file),
        'Cache-Control': 'public, max-age=31536000', // 1y
        'Cache-Tag': 'file',
      },
      body: content,
    };
  };
}

function isVersion(maybeVersion: string) {
  // NPM pattern
  switch (maybeVersion) {
    case 'latest':
    case 'next':
    case 'beta':
    case 'alpha':
    case 'experimental':
    case 'rc':
      return true;
    default:
      return /^\d+\.\d+\.\d+(-.*)?$/.test(maybeVersion);
  }
}
