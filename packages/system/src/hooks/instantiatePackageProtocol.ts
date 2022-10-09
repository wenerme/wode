import type { Logger } from '@wener/utils';
import type { SystemJS } from '../utils/getGlobalSystem';
import { getGlobalSystem } from '../utils/getGlobalSystem';
import { legacy, resolve } from '../utils/resolve';

interface PackageResolveOptions {
  protocol?: string;
  resolveUrl?: (v: string) => string;
  resolveSystemUrl?: (v: string) => string;
  isPrivate?: (v: string) => boolean;
  logger?: Logger;
  System?: SystemJS;
}

export function instantiatePackageProtocol({
  protocol = 'package',
  resolveUrl = (v) => `https://cdn.jsdelivr.net/npm/${v}`,
  resolveSystemUrl = (v) => `https://ga.system.jspm.io/npm:${v}`,
  isPrivate = () => false,
  logger = console,
  System = getGlobalSystem(),
}: PackageResolveOptions = {}) {
  const orig = System.constructor.prototype.instantiate.bind(System);
  System.constructor.prototype.instantiate = async function (url: string, parent?: string) {
    if (!url.startsWith(`${protocol}:`)) {
      return orig(url, parent);
    }

    const loader = System;
    let nextUrl = url;
    const nextParent = parent;

    // package:react -> react
    const originModuleId = new URL(url).pathname;

    let {
      n: name,
      v: ver = 'latest',
      p: path = '',
    } = originModuleId.match(
      /^(?<n>(?:@(?<org>[a-z0-9-~][a-z0-9-._~]*)\/)?(?<pkg>[a-z0-9-~][a-z0-9-._~]*))(?:@(?<v>[-a-z0-9><=_.^~*| ]+))?(?<p>\/[^\r\n]*)?$/,
    )?.groups || {};
    if (!name) {
      throw new Error(`Invalid package name ${url}`);
    }

    // resolve the version by jsdelivr
    // preload package.json to System

    // https://cdn.jsdelivr.net/npm/@wener/reaction@latest/package.json
    const metaModuleUrl = resolveUrl(`${name}@${ver}/package.json`);
    let meta;
    {
      logger.debug(`load package.json for ${url} through ${metaModuleUrl}`);

      const module = await System.import(metaModuleUrl);
      if (!module?.default) {
        throw new Error(`package.json of ${name} -> ${metaModuleUrl} not found`);
      }
      meta = module.default;

      // exact version
      // if (ver !== meta.version) {
      //   // preload exact version module id
      //   let exactModuleId = `${name}@${meta.version}/package.json`;
      //   loader.set(resolveUrl(exactModuleId), metaModule);
      //   loader.set(resolveSystemUrl(exactModuleId), metaModule);
      //   loader.set(`${protocol}:${exactModuleId}`, metaModule);
      // }
    }

    const base = resolveUrl(`${name}@${meta.version}/`);
    const baseSystem = resolveSystemUrl(`${name}@${meta.version}/`);

    const pri = isPrivate(name);

    // /lib -> /lib/package.json -> .module, .import, .main
    // /lib -> /lib/index.js
    // /lib -> /lib.js
    // /package.json -> .exports

    const isBrowser = typeof window !== 'undefined';

    let resolved: string | undefined;
    let isSystem = false;

    if (!path || path === '/') {
      path = '.';
    } else if (path[0] === '/') {
      path = '.' + path;
    }

    // try modern exports
    if (meta.exports) {
      try {
        resolved = resolve(meta, path, { unsafe: true, conditions: ['system', 'production'] });
        // if exports only have default will also resolve, recheck the system condition
        isSystem = Boolean(meta.exports['.']?.system);
      } catch (e) {
        try {
          // at least use esm
          resolved = resolve(meta, path, { browser: isBrowser, require: false, conditions: ['production'] });
        } catch (e) {
          if (!path.endsWith('.js')) {
            throw e;
          }
          logger.warn(`try direct ${path} from ${url} failed: ${e}`);
          resolved = path;
        }
      }
    } else if (path === '.') {
      resolved = legacy(meta, { fields: ['system'] });
      isSystem = Boolean(resolved);
      resolved ??= legacy(meta, { browser: isBrowser, fields: ['module', 'import', 'main'] });
    } else if (path.endsWith('.js')) {
      resolved = path;
    } else {
      // react-icons/tb -> react-icons/tb/package.json
      let subBase = new URL(path, base).href;
      if (!subBase.endsWith('/')) {
        subBase += '/';
      }
      const pkgUrl = new URL('package.json', subBase).href;
      try {
        logger.debug(`try resolve package.json of sub-path ${path} through ${pkgUrl}`);
        const { default: meta } = await loader.import(pkgUrl);
        resolved = meta.exports
          ? resolve(meta)
          : legacy(meta, {
              browser: isBrowser,
              fields: ['module', 'import', 'main'],
            });
        if (resolved) {
          // xyz + ./index.js -> xyz/index.js
          resolved = path + resolved.substring(1);
        }
      } catch (e) {
        logger.error(`Failed to resolve package.json for ${url} -> ${path} -> ${pkgUrl}`, e);
      }
    }

    if (resolved) {
      if (isSystem || !resolved.endsWith('.js')) {
        nextUrl = new URL(resolved, base).href;
        // nextParent = base;
      } else if (pri) {
        throw new Error(`Resolve ${url} to ${resolved} external`);
      } else {
        // nextParent = baseSystem;
        nextUrl = new URL(resolved, baseSystem).href;
      }
      logger.info(`resolved ${url} from ${parent || 'top level'} -> ${resolved} (system:${isSystem}) -> ${nextUrl}`);
    } else {
      throw new Error(`Resolve ${url} failed`);
    }

    const result = await orig(nextUrl, nextParent);
    result[0] = result[0].map((v: string) => {
      if (v.startsWith('./')) {
        return new URL(v, nextUrl).href;
      }
      return v;
    });
    return result;
  };
}
