import { type Logger, parseModuleId } from '@wener/utils';
import { getGlobalSystem, SystemJS } from '../utils/getGlobalSystem';

export function resolveBareSpecifier({
  protocol = 'package',
  System = getGlobalSystem(),
  logger = console,
  cache = false,
}: { protocol?: string; System?: SystemJS; logger?: Logger; cache?: boolean } = {}) {
  const orig = System.resolve.bind(System);
  const map = new Map();

  System.resolve = (id: string, parentUrl?: string) => {
    try {
      return cache ? map.get(id) || orig(id, parentUrl) : orig(id, parentUrl);
    } catch (e) {
      if (parseModuleId(id)) {
        let r = `${protocol}:${id}`;
        logger.debug(`resolve bare specifier ${id} as ${r} from ${parentUrl || 'top level'}`);
        map.set(id, r);
        return orig(r, parentUrl);
      }
      throw e;
    }
  };
}
