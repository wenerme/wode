import { Module } from '@wener/utils';

/**
 * Try to get the global System instance
 */
export function getGlobalSystem(): SystemJS {
  if (typeof window === 'undefined') {
    // @ts-expect-error
    return globalThis.System;
  }
  // after jspom polyfill window != globalThis
  // @ts-expect-error
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

type Registration = [deps: string[], fn: DeclareFn, metas?: Array<ImportAssertion | undefined>];

export interface ImportAssertion {
  assert?: {
    type?: string;
    [k: string]: any;
  };

  [k: string]: any;
}

export interface ImportMeta {
  url: string;
  env?: Record<string, any>;
  resolve?: (id: string, parentUrl?: string) => string;
}

export type DeclareFn = (
  _export: (o: any) => void,
  _context: {
    import: (moduleId: string, parentUrl?: string) => Promise<Module>;
    meta: ImportMeta;
  },
) => { setters?: Array<(module: any) => any>; execute?: () => void };

/**
 * SystemJS
 *
 * Import process:
 *
 * 1. prepareImport
 * 2. resolve
 * 3. getOrCreateLoad
 *   1. async instantiate
 *   2. async prepare registration
 *   3. async link - instantiate deps - invoke all setters
 *   4. store registration
 * 4. wait
 */
export interface SystemJS {
  /**
   * This represents the System base class, which can be extended or reinstantiated to create a custom System instance.
   * @category Core
   */
  constructor(): SystemJS; // eslint-disable-line @typescript-eslint/no-misused-new

  /**
   * Applies to the global loading extra.
   *
   * Setting `System.firstGlobalProp = true` will ensure that the global loading extra will always use
   * the first new global defined as the global module value, and not the last new global defined.
   *
   * For example, if importing the module `global.js`:
   *
   * ```js
   * window.a = 'a';
   * window.b = 'b';
   * ```
   *
   * `System.import('./global.js')` would usually `{ default: 'b' }`.
   *
   * Setting `System.firstGlobalProp = true` would ensure the above returns `{ default: 'a' }`.
   *
   * > Note: This will likely be the default in the next major release.
   *
   * @category Core
   */
  firstGlobalProp?: boolean;

  /**
   * Loads a module by name taking an optional normalized parent URL argument.
   *
   * Promise resolves to the ES module namespace value.
   * @param parentUrl  must be a valid URL, or URL resolution may break.
   * @category Core
   */
  import: (id: string, parentUrl?: string, meta?: ImportAssertion) => Promise<Module>;

  /**
   * Resolves a module specifier relative to an optional parent URL, returning the resolved URL.
   * @category Core
   */
  resolve(id: string, parentUrl?: string): string;

  /**
   * instantiate the resolved id to a register
   * provided by: fetch-load, script-load
   * @category Hook
   * @internal
   */
  instantiate(url: string, parent: string): Promise<[deps: string[], declar: DeclareFn]>;

  /**
   * create the module content from the registration
   * @category Hook
   * @internal
   */
  createContext(parentId: string): ImportMeta;

  /**
   * provide by: script-load
   * @internal
   * @category Hook
   */
  createScript?: (url: string) => HTMLScriptElement;

  /**
   * will the url be fetched by {@link fetch}
   * @category Hook
   * @internal
   */
  shouldFetch(url: string): boolean;

  /**
   * fetch the url - the fetched content should invoke the System.register
   * can be used to transform the content.
   *
   * fetch-load use this function to instantiate module, then return the getRegister()
   *
   * provided by: node-fetch
   * @category Hook
   * @internal
   */
  fetch(
    url: string,
    options?: {
      /**
       * skip module type detect
       */
      passThrough?: boolean;
    },
  ): Promise<Response>;

  /**
   * Retrieve a loaded module from the registry by ID.
   *
   * Module records with an error state will return `null`.
   * @category Registry
   */
  get(id: string): any | null;

  /**
   * Determine if a given ID is available in the loader registry.
   *
   * Module records that have an error state in the registry still return `true`,
   * while module records with in-progress loads will return `false`.
   * @category Registry
   */
  has(id: string): boolean;

  /**
   * Sets a module in the registry by ID. Note that when using import maps, the id must be a URL.
   *
   *
   * ```js
   * System.set('http://site.com/normalized/module/name.js', {
   *   exportedFunction: value
   * });
   * ```
   *
   * `module` is an object of names to set as the named exports.
   *
   * If `module` is an existing Module Namespace, it will be used by reference.
   *
   * If you want to remap the url to a bare specifier, you can do so with an import map:
   *
   * ```html
   * <script type="systemjs-importmap">
   *   {
   *     "imports": {
   *       "@angular/core": "app:@angular/core"
   *     }
   *   }
   * </script>
   * <script>
   *   // Using the 'app:' prefix makes the string a URL instead of a bare specifier
   *   System.set('app:@angular/core', window.angularCore);
   *   System.import('@angular/core');
   * </script>
   * ```
   * @category Registry
   */
  set(id: string, module: any): void;

  /**
   * Allows you to retrieve all modules in the System registry. Each value will be an array with two values: a key and the module.
   * @category Registry
   */
  entries(): Iterable<[string, any]>;

  /**
   * Allows adding an import map without using the DOM.
   * @category Import Maps
   */
  addImportMap(map: ImportMap, parentUrl?: string): void;

  /**
   * Trigger load imort map
   * @category Import Maps
   * @internal
   */
  prepareImport(doProcessScripts?: boolean): Promise<any>;

  /**
   * Declaration function for defining modules of the `System.register` polyfill module format.
   * @category Core
   */
  register(...args: Registration): void;
  /**
   * @category Named Register
   */
  register(name: string, ...args: Registration): void;

  /**
   * Last {@link register} invocation params
   * @category Hook
   */
  getRegister(): Registration;

  /**
   * Deletes a module from the registry by ID.
   *
   * Returns true if the module was found in the registry before deletion.
   * @category Registry
   */
  delete(id: string): false | (() => void);

  /**
   * used by module-types
   * @internal
   */
  wasmModules?: Record<string, WebAssembly.Module>;
}

declare let System: SystemJS; // eslint-disable-line @typescript-eslint/no-unused-vars

/**
 * Internal load object
 *
 * Capital letter = a promise function
 */
export interface SystemModuleInstantiator {
  id: string;
  // importerSetters, the setters functions registered to this dependency
  // we retain this to add more later
  i: Array<(m: Module) => void>;
  // module namespace object
  n: Module;
  // extra module information for import assertion
  // { assert: { type: 'xyz' } }
  m: any;

  // instantiate
  I: Promise<[deps: string, setters: ReturnType<DeclareFn>['setters']]>;
  // link
  L: Promise<any>;
  // whether it has hoisted exports
  // dose module has export ?
  h: boolean;

  // On instantiate completion we have populated:
  // dependency load records
  d?: Module[];
  // execution function
  e?: ReturnType<DeclareFn>['execute'];

  // When execution we have populated:
  // the execution error if any
  er?: any;
  // in the case of TLA, the execution promise
  E?: Promise<any>;

  // On execution, L, I, E cleared

  // Promise for top-level completion
  C?: Promise<any>;

  // parent instantiator / executor
  p?: SystemModuleInstantiator;
}
