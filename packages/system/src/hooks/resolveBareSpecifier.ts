import { type Logger, parseModuleId } from '@wener/utils';
import type { SystemJS } from '../utils/getGlobalSystem';
import { getGlobalSystem } from '../utils/getGlobalSystem';

export function resolveBareSpecifier({
  protocol = 'package',
  System = getGlobalSystem(),
  logger = console,
  cache = false,
}: { protocol?: string; System?: SystemJS; logger?: Logger; cache?: boolean } = {}) {
  const orig = System.constructor.prototype.resolve.bind(System);
  const map = new Map();
  const prefix = `${protocol}:`;

  System.constructor.prototype.resolve = (id: string, parentUrl?: string) => {
    try {
      const out = cache && map.get(id);

      // dynamic import
      // handle ./a.js, package:@wener/reaction
      if (!out && id.startsWith('.') && parentUrl && parentUrl.startsWith(prefix)) {
        if (!parseModuleId(parentUrl.substring(prefix.length))?.path) {
          parentUrl = `${parentUrl}/`;
        }
      }

      return out || orig(id, parentUrl);
    } catch (e) {
      // handle ./a.js @wener/reaction
      if (id.startsWith('.') && parentUrl) {
        const m = parseModuleId(parentUrl);
        if (m) {
          let r = `${protocol}:${parentUrl}`;
          // ensure parentUrl is a package
          if (!m.path) {
            r += '/';
          }
          return orig(id, r);
        }
      }
      // handle @wener/reaction
      if (parseModuleId(id)) {
        const r = `${protocol}:${id}`;
        logger.debug(`resolve bare specifier ${id} as ${r} from ${parentUrl || 'top level'}`);
        map.set(id, r);
        return orig(r, parentUrl);
      }
      throw e;
    }
  };
}

/*
resolve package.json in resolve stage

在 instantiate resolve 会导致
  @org/pkg -> https://example.com/org/pkg/dist/index.js
  但 System 知道的是 @org/pkg
    所以在 org/pkg/dist/index.js 进行 import('./a.js') 时会 resolve 为 @org/pkg/a.js 而不是 https://example.com/org/pkg/dist/a.js
    导致 import('./a.js') 会失败
  因此需要在 resolve 阶段进行 package.json 的 resolve

System.resolve 为 sync 模式
但内部的 resolve 多在 async 环境下，因此使用 async 应该问题不大
 */
