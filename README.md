# wode

Wener Node Monorepo

- packages
  - system - [@wener/system](https://www.npmjs.com/package/@wener/system)
    - hooks to lets systemjs work with npm registry & package.json
  - reaction - [@wener/reaction](https://www.npmjs.com/package/@wener/reaction)
    - React hooks & utils
  - utils - [@wener/utils](https://www.npmjs.com/package/@wener/utils)
    - Typescript
    - Zero Dependencies
  - ethers - WIP
    - Web3 utils
- apps
  - demo https://wode.vercel.app/
    - TipTap based Google Doc
      - Extensions
        - classNames, column-count, margin-{left,right,top,bottom}, line-height, font-size, text-indent, letter-spacing
        - video, indent
        - renderMarkdown
        - parseMarkdown
        - slash command
    - [ ] WindowManager

## Dev

- Node 16+
- turbo

```bash
make build
```

## TODO

- TipTapWord
  - [ ] 媒体资源选中编辑时回显
  - [ ] 媒体资源允许配置 URL
  - [ ] TOC
  - [ ] 属性编辑器
  - [ ] LineHeight 菜单
  - [ ] print
  - [ ] toolbar memo


<!-- LINK:BEGIN -->

# Links

* Site
  * [wener.me](https://wener.me)
    * Blog
    * Github [wenerme/wener](https://github.com/wenerme/wener)
  * [wode.vercel.app](https://wode.vercel.app/)
    * Playground
    * GitHub [wenerme/wode](https://github.com/wenerme/wode) 
  * [apis.wener.me](https://apis.wener.me/)
    * APIs playground with docs & stories
    * GitHub [wenerme/apis](https://github.com/wenerme/apis)
* Library
  * [@wener/reaction](https://www.npmjs.com/package/@wener/reaction) - ![VERSION](https://img.shields.io/npm/v/@wener/reaction) - ![LICENSE](https://img.shields.io/npm/l/@wener/reaction)
    * [Docs](https://wode.vercel.app/docs/modules/_wener_reaction.html) 
    * React hooks, render, logical components
    * helpful typing
    * some external minimal helpful utils
      * reduce packages
  * [@wener/utils](https://www.npmjs.com/package/@wener/utils) - ![VERSION](https://img.shields.io/npm/v/@wener/utils) - ![LICENSE](https://img.shields.io/npm/l/@wener/utils)
    * [Docs](https://wode.vercel.app/docs/modules/_wener_utils.html)
    * utils for daily use
    * zero dependencies
  * [@wener/system](https://www.npmjs.com/package/@wener/system) - ![VERSION](https://img.shields.io/npm/v/@wener/system) - ![LICENSE](https://img.shields.io/npm/l/@wener/system)
    * [Docs](https://wode.vercel.app/docs/modules/_wener_system.html)
    * Utils for systemjs
    * make systemjs work with npm & package.json
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
