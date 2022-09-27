import { getGlobalSystem, SystemJS } from './getGlobalSystem';

export function addSystemPreload(
  id: string,
  preload: (() => Promise<any>) | object,
  { System = getGlobalSystem() }: { System?: SystemJS } = {},
) {
  if (System.has(id)) {
    return false;
  }

  let resolvedId;
  try {
    resolvedId = System.resolve(id);
  } catch (e) {}

  if (resolvedId && System.has(resolvedId)) {
    return false;
  }

  if (typeof preload === 'function') {
    System.register(id, [], (exports) => {
      return {
        execute: async () => {
          exports(await preload());
        },
      };
    });
    return true;
  }

  try {
    new URL(resolvedId || id);
  } catch (e) {
    throw new Error(`"${id}" is not a valid URL to set in the module registry`);
  }
  System.set(resolvedId || id, preload);
  return true;
}
