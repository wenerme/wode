import { getGlobalSystem, SystemJS } from './getGlobalSystem';

export function addPreload(
  id: string,
  preload: (() => Promise<any>) | object,
  { System = getGlobalSystem(), override }: { System?: SystemJS; override?: boolean } = {},
) {
  if (!override && System.has(id)) {
    return false;
  }

  let resolvedId;
  try {
    resolvedId = System.resolve(id);
  } catch (e) {}

  if (!override && resolvedId && System.has(resolvedId)) {
    return false;
  }

  let isBareSpecifier = true;
  const moduleId = resolvedId || id;
  try {
    void new URL(id);
    isBareSpecifier = false;
  } catch (e) {}

  if (typeof preload === 'function') {
    // resolved by named register
    // can not detect url register
    if (!override && isBareSpecifier && resolvedId === id) {
      return false;
    }
    if (override) {
      System.delete(id);
    }
    System.register(id, [], (exports) => {
      return {
        execute: async () => {
          exports(await preload());
        },
      };
    });
    return true;
  }
  if (!resolvedId && isBareSpecifier) {
    throw new Error(`"${id}" is not a valid URL to set in the module registry`);
  }
  System.set(moduleId, preload);
  return true;
}
