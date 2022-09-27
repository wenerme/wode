import { Logger } from '@wener/utils';
import { getGlobalSystem, SystemJS } from '../utils/getGlobalSystem';
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
  const orig = System.instantiate!.bind(System);
  // cache resolve
  const cache = new Map<string, string>();
  System.instantiate = async function (url: string, parent: string) {
    const loader = System;
    let next = url;
    let shouldCache = false;
    // .has 往后 load 会导致 fetch 请求 package:xxx/package.json

    if (url.startsWith(`${protocol}:`)) {
      let prev = cache.get(url);
      if (prev) {
        return orig(prev, parent);
      }
      shouldCache = true;

      // @wener/reaction ->  @wener/reaction@1.2.11
      // @wener/reaction@latest ->  @wener/reaction@1.2.11
      // @wener/reaction@^1 ->  @wener/reaction@1.2.11
      // resolve the version by jsdelivr
      // cache the package.json for later use

      // https://cdn.jsdelivr.net/npm/@wener/reaction@latest/package.json
      // https://ga.system.jspm.io/npm:@wener/reaction@1.2.11/package.json

      const originModuleId = new URL(url).pathname;
      let {
        n: name,
        v: ver = 'latest',
        p: path = '',
      } = originModuleId.match(
        /^(?<n>(?:@(?<org>[a-z0-9-~][a-z0-9-._~]*)\/)?(?<pkg>[a-z0-9-~][a-z0-9-._~]*))(?:@(?<v>[-a-z0-9><=_.^~*| ]+))?(?<p>\/[^\r\n]*)?$/,
      )?.groups || {};

      // resolve version

      const metaModuleUrl = resolveUrl(`${name}@${ver}/package.json`);
      let meta;
      if (!System.has(metaModuleUrl)) {
        logger.debug(`load package.json for ${url} through ${metaModuleUrl}`);
        let metaModule = await loader.import(metaModuleUrl);
        meta = metaModule.default;
        if (ver !== meta.version) {
          // same
          let exactModuleId = `${name}@${meta.version}/package.json`;
          loader.set(resolveUrl(exactModuleId), metaModule);
          loader.set(resolveSystemUrl(exactModuleId), metaModule);
          loader.set(`${protocol}:${exactModuleId}`, metaModule);
        }
      } else {
        let module = await System.import(metaModuleUrl);
        if (!module) {
          throw new Error(`Module ${metaModuleUrl} not found`);
        }
        ({ default: meta } = module);
      }

      let base = resolveUrl(`${name}@${meta.version}/`);
      let baseSystem = resolveSystemUrl(`${name}@${meta.version}/`);

      let pri = isPrivate(name);

      // /lib -> /lib/package.json -> .module, .import, .main
      // /lib -> /lib/index.js
      // /lib -> /lib.js
      // /package.json -> .exports

      let isBrowser = typeof window !== 'undefined';

      let resolved: string | void;
      let isSystem = false;

      if (!path || path === '/') {
        path = '.';
      } else if (path[0] === '/') {
        path = '.' + path;
      }

      if (meta.exports) {
        try {
          resolved = resolve(meta, path, { unsafe: true, conditions: ['system', 'production'] });
          // 部分只有 default - 会被错误识别
          isSystem = Boolean(meta.exports['.']?.['system']);
        } catch (e) {
          // at least use esm
          resolved = resolve(meta, path, { browser: isBrowser, require: false, conditions: ['production'] });
        }
      } else if (path === '.') {
        try {
          resolved = legacy(meta, { fields: ['system'] });
          isSystem = true;
        } catch (e) {
          resolved = legacy(meta, { browser: isBrowser, fields: ['module', 'import', 'main'] });
        }
      } else if (path.endsWith('.js')) {
        resolved = path;
      } else {
        // react-icons/tb -> react-icons/tb/package.json
        let pkgUrl = new URL('package.json', next).href;
        try {
          const { default: meta } = await loader.import(pkgUrl);
          resolved = meta.exports
            ? resolve(meta)
            : legacy(meta, {
                browser: isBrowser,
                fields: ['module', 'import', 'main'],
              });
        } catch (e) {
          console.error(`Failed to resolve package.json for ${url} -> ${path} -> ${pkgUrl}`, e);
        }
      }

      if (resolved) {
        if (isSystem || !resolved.endsWith('.js')) {
          next = new URL(resolved, base).href;
        } else if (pri) {
          throw new Error(`Resolve ${url} to ${resolved} external`);
        } else {
          next = new URL(resolved, baseSystem).href;
        }
        logger.info(`resolved ${url} -> ${resolved} (system:${isSystem}) -> ${next}`);
      } else {
        throw new Error(`Resolve ${url} failed`);
      }
    }

    let result = orig(next, parent);
    if (shouldCache && 'then' in result) {
      return result.then((v: any) => {
        if (url.startsWith(`${protocol}:`)) {
          logger.debug(`cache resolve:`, url, next);
          cache.set(url, next);
        }
        return v;
      });
    }
    return result;
  };
}
