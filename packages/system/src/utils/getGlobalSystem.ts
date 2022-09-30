export function getGlobalSystem(): SystemJS {
  if (typeof window === 'undefined') {
    // @ts-ignore
    return globalThis.System;
  }
  // after jspom polyfill window != globalThis
  // @ts-ignore
  return window.System ?? globalThis.System;
}

/**
 * spec {@link https://github.com/wicg/import-maps import maps}
 */
export interface ImportMap {
  imports?: Record<string, string>;
  scopes?: Record<string, Record<string, string>>;
  depcache?: Record<string, any>;
  integrity?: Record<string, any>;
}

export type Module = {
  default?: any;
  [k: string | symbol]: any;
  [Symbol.toStringTag]: 'Module';
};

export type DeclareFn = (
  _export: (o: any) => void,
  _context: {
    import: (moduleId: string, parentUrl?: string) => Promise<Module>;
    meta: {
      url: string;
      env?: Record<string, any>;
      resolve?: (moduleId: string, parentUrl?: string) => string;
    };
  },
) => { setters?: Array<(module: any) => any>; execute?: () => void };

export interface SystemJS {
  import: (moduleId: string, parentUrl?: string) => Promise<Module>;
  instantiate: (url: string, parent: string) => Promise<[deps: string[], fn: DeclareFn]>;
  shouldFetch: (url: string) => boolean;
  fetch: (url: string, options?: any) => Promise<any>;
  resolve: (moduleId: string, parentUrl?: string) => string;
  get: (moduleId: string) => any | null;
  has: (moduleId: string) => boolean;
  set: (moduleId: string, module: any) => void;
  entries: () => Iterable<[string, any]>;

  addImportMap: (map: ImportMap, parentUrl?: string) => void;
  prepareImport: (doProcessScripts?: boolean) => Promise<any>;

  register(name: string, dependencies: string[], declare: DeclareFn): void;

  delete(moduleId: string): false | (() => void);
}

// declare let System: SystemJS;
declare global {
  let System: SystemJS;
  namespace NodeJS {
    interface Global {
      System: SystemJS;
    }
  }
}
