import test from 'ava';
import { ConstructorOptions, JSDOM, ResourceLoader, ResourceLoaderConstructorOptions } from 'jsdom';

test.before(() => browserEnv());
test('browserEnv', (t) => {
  t.truthy(globalThis.window);
  t.truthy(globalThis.document);
});

export function browserEnv() {
  if (typeof globalThis === 'undefined') {
    throw new Error('globalThis is not defined');
  }

  if (typeof window !== 'undefined') {
    return window;
  }

  // https://github.com/lukechilds/window/blob/master/src/index.js
  class Window {
    constructor(opts: ResourceLoaderConstructorOptions & ConstructorOptions = {}) {
      const { proxy, strictSSL, userAgent, ...jsdomOpts } = opts;
      const resources = new ResourceLoader({
        proxy,
        strictSSL,
        userAgent,
      });
      return new JSDOM(
        '',
        Object.assign(jsdomOpts, {
          resources,
        }),
      ).window;
    }
  }

  // https://github.com/lukechilds/browser-env/blob/master/src/index.js
  // Default jsdom config.
  // These settings must override any custom settings to make sure we can iterate
  // over the window object.
  const defaultJsdomConfig = {
    // features: {
    //   FetchExternalResources: false,
    //   ProcessExternalResources: false,
    // },
  };
  // IIFE executed on import to return an array of global Node.js properties that
  // conflict with global browser properties.
  const protectedProperties = (() =>
    Object.getOwnPropertyNames(new Window(defaultJsdomConfig)).filter(
      (prop) => typeof globalThis[prop as keyof typeof globalThis] !== 'undefined',
    ))();

  function installEnv(...args: any[]) {
    // Sets up global browser environment
    // Extract options from args
    const properties = args.filter((arg: any) => Array.isArray(arg))[0];
    const userJsdomConfig = args.filter((arg: any) => !Array.isArray(arg))[0];

    // Create window object
    const window = new Window(Object.assign({}, userJsdomConfig, defaultJsdomConfig));

    // Get all global browser properties
    Object.getOwnPropertyNames(window)

      // Remove protected properties
      .filter((prop) => protectedProperties.indexOf(prop) === -1)

      // If we're only applying specific required properties remove everything else
      .filter((prop) => !(properties && properties.indexOf(prop) === -1))
      .filter((prop) => {
        switch (prop) {
          case 'undefined':
            return false;
        }
        return true;
      })

      // Copy what's left to the Node.js global scope
      .forEach((prop) => {
        // console.debug(`define globalThis.${prop}`);
        Object.defineProperty(globalThis, prop, {
          configurable: true,
          get: () => window[prop as keyof Window] as any,
        });
      });

    return window;
  }

  return installEnv();
}
