# @wener/unpkg

Selfhost https://unpkg.com/ , https://cdn.jsdelivr.net/npm/ alternative

- Handler Endpoints
  - Unpkg
    - `GET /:pkg@:version` - version metadata
    - `GET /:pkg@:version/:file`
  - NPM
    - `GET /:pkg` - registry index
    - `GET /:pkg/:version` - version metadata
    - `GET /:pkg/-/:name-:version.tgz` - tarball - redirect
  - [ ] SystemJS - With proper resolve, redirect js to system.ga.jspm.io or dynamic transfer with rollup/swc
    - `GET /system/:pkg@:version`
    - `GET /system/:pkg@:version/:file`
- [ ] deploy to https://apis.wener.me/api/unpkg
  - with cloudflare cdn
  - vercel is blocked by China
- Will resolve range/tag version to exact version
  - use 302 redirect

```ts
import { Unpkg } from '@wener/unpkg';
import { createBearerAuthFetch, createUnpkg, createUnpkgHandler } from '@wener/unpkg/server';

const unpkg = await createUnpkg({
  logger: fastify.log,
  url: process.env.UNPKG_REGISTRY,
  sqlite: {
    database: process.env.UNPKG_CACHE_DB,
  },
});
// for private npm registry
if (process.env.UNPKG_TOKEN) {
  unpkg.fetch = createBearerAuthFetch(process.env.UNPKG_TOKEN);
}

// for server handler
// NextJS, fastify, etc.
const handler = await createUnpkgHandler({
  unpkg,
  prefix: '/api/unpkg',
});
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
