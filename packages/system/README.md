# SystemJS

Utils for SystemJS

**Browser env**

```js
import { addPreload, getGlobalSystem, loadBrowserSystem } from '@wener/system';
import { createNoopLogger } from '@wener/utils';

// use script load to avoid minify error - nextjs & swc minify make cause minify error
await loadBrowserSystem({ logger: createNoopLogger(), script: true });

// make external lib works with current react
const BuiltinModules = {
  react: () => import('react'),
  'react/jsx-runtime': () => import('react/jsx-runtime'),
  'react-dom': () => import('react-dom'),
  'react-dom/client': () => import('react-dom/client'),
};
Object.entries(BuiltinModules).map(([k, v]) => addPreload(k, v));

const System = getGlobalSystem();
// load through jsdelivr & ga.system.jspm.io
const { ErrorSuspenseBoundary } = await System.import('@wener/reaction');
console.log(`Result`, React.createElement(ErrorSuspenseBoundary));
```

**Server env**

```js
import { getGlobalSystem } from '@wener/system';
import { loadServerSystem } from '@wener/system/server';
import { createNoopLogger } from '@wener/utils';

await loadServerSystem({ logger: createNoopLogger() });
const System = getGlobalSystem();
// load through jsdelivr & ga.system.jspm.io
const { default: React } = await System.import('react');
console.log(`React`, React.createElement('a'));
```

<!-- LINK:BEGIN -->

# Links

* Site
  * [wener.me](https://wener.me)
    * Blog
    * Github [wenerme/wener](https://github.com/wenerme/wener)
  * [apis.wener.me](https://apis.wener.me/)
    * APIs playground with docs & stories
    * Github [wenerme/apis](https://github.com/wenerme/apis)
* Library
  * [@wener/reaction](https://www.npmjs.com/package/@wener/reaction) - ![VERSION](https://img.shields.io/npm/v/@wener/reaction) - ![LICENSE](https://img.shields.io/npm/l/@wener/reaction)
    * React hooks, render, logical components
    * helpful typing
    * some external minimal helpful utils
      * reduce packages
  * [@wener/utils](https://www.npmjs.com/package/@wener/utils) - ![VERSION](https://img.shields.io/npm/v/@wener/utils) - ![LICENSE](https://img.shields.io/npm/l/@wener/utils)
    * utils for daily use
    * [Document](https://apis.wener.me/docs/@wener/utils/)
  * [@wener/ui](https://www.npmjs.com/package/@wener/ui) - ![VERSION](https://img.shields.io/npm/v/@wener/ui) - ![LICENSE](https://img.shields.io/npm/l/@wener/ui)
    * [Storybook](https://apis.wener.me/storybook/@wener/ui)
    * [Document](https://apis.wener.me/docs/@wener/ui/)
  * [@wener/tinyrpc](https://www.npmjs.com/package/@wener/tinyrpc) - ![VERSION](https://img.shields.io/npm/v/@wener/tinyrpc) - ![LICENSE](https://img.shields.io/npm/l/@wener/tinyrpc)
    * [Document](https://apis.wener.me/docs/@wener/tinyrpc/)
  * [rjsf-antd-theme](https://www.npmjs.com/package/rjsf-antd-theme) - ![VERSION](https://img.shields.io/npm/v/rjsf-antd-theme) - ![LICENSE](https://img.shields.io/npm/l/rjsf-antd-theme)
    * Ant Design Theme for React Json Schema Form
    * [Storybook](https://apis.wener.me/storybook/rjsf-antd-theme)
    * [Document](https://apis.wener.me/docs/rjsf-antd-theme/)

<!-- LINK:END -->
