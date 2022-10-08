# wode

Wener Node Monorepo

- packages
  - @wener/system
    - hooks to lets systemjs work with npm registry & package.json
  - @wener/reaction
    - React hooks & utils
  - @wener/utils
    - Typescript
    - Zero Dependencies
  - @wener/torrent
    - Bencode codec
  - @wener/tiptap
    - TipTap based Google Doc
      - Extensions
        - classNames, column-count, margin-{left,right,top,bottom}, line-height, font-size, text-indent, letter-spacing
        - video, indent
        - renderMarkdown
        - parseMarkdown
        - slash command
  - @wener/unpkg
    - Selfhost https://unpkg.com/ , https://cdn.jsdelivr.net/npm/ alternative
  - @wener/wode
    - common config
  - ethers - WIP
    - Web3 utils
- apps
  - demo https://wode.vercel.app/
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
- Typedoc
  - package multi entryPoints
    https://github.com/TypeStrong/typedoc/issues/1937

<!-- LINK:BEGIN -->

# Links

**Summary**

| Repository                       | NPM                                   | Info                                                                                         |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------- |
| [@wener/utils][utils-repo]       | [![][utils-version]][utils-npm]       | [Doc][utils-doc]<br/> ![][utils-license]<br/>![][utils-size]<br/>![][utils-deps]             |
| [@wener/system][system-repo]     | [![][system-version]][system-npm]     | [Doc][system-doc]<br/> ![][system-license]<br/>![][system-size]<br/>![][system-deps]         |
| [@wener/reaction][reaction-repo] | [![][reaction-version]][reaction-npm] | [Doc][reaction-doc]<br/> ![][reaction-license]<br/>![][reaction-size]<br/>![][reaction-deps] |
| [@wener/torrent][torrent-repo]   | [![][torrent-version]][torrent-npm]   | [Doc][torrent-doc]<br/> ![][torrent-license]<br/>![][torrent-size]<br/>![][torrent-deps]     |
| [@wener/unpkg][unpkg-repo]       | [![][unpkg-version]][unpkg-npm]       | [Doc][unpkg-doc]<br/> ![][unpkg-license]<br/>![][unpkg-size]<br/>![][unpkg-deps]             |
| [@wener/wode][wode-repo]         | [![][wode-version]][wode-npm]         | [Doc][wode-doc]<br/> ![][wode-license]<br/>![][wode-size]<br/>![][wode-deps]                 |

[utils-repo]: https://github.com/wenerme/wode/tree/main/packages/utils
[utils-npm]: https://www.npmjs.com/package/@wener/utils
[utils-version]: https://img.shields.io/npm/v/@wener/utils
[utils-license]: https://img.shields.io/npm/l/@wener/utils
[utils-size]: https://badgen.net/bundlephobia/minzip/@wener/utils
[utils-deps]: https://badgen.net/bundlephobia/dependency-count/@wener/utils
[utils-doc]: https://wode.vercel.app/docs/modules/_wener_utils.html
[system-repo]: https://github.com/wenerme/wode/tree/main/packages/system
[system-npm]: https://www.npmjs.com/package/@wener/system
[system-version]: https://img.shields.io/npm/v/@wener/system
[system-license]: https://img.shields.io/npm/l/@wener/system
[system-size]: https://badgen.net/bundlephobia/minzip/@wener/system
[system-deps]: https://badgen.net/bundlephobia/dependency-count/@wener/system
[system-doc]: https://wode.vercel.app/docs/modules/_wener_system.html
[reaction-repo]: https://github.com/wenerme/wode/tree/main/packages/reaction
[reaction-npm]: https://www.npmjs.com/package/@wener/reaction
[reaction-version]: https://img.shields.io/npm/v/@wener/reaction
[reaction-license]: https://img.shields.io/npm/l/@wener/reaction
[reaction-size]: https://badgen.net/bundlephobia/minzip/@wener/reaction
[reaction-deps]: https://badgen.net/bundlephobia/dependency-count/@wener/reaction
[reaction-doc]: https://wode.vercel.app/docs/modules/_wener_reaction.html
[torrent-repo]: https://github.com/wenerme/wode/tree/main/packages/torrent
[torrent-npm]: https://www.npmjs.com/package/@wener/torrent
[torrent-version]: https://img.shields.io/npm/v/@wener/torrent
[torrent-license]: https://img.shields.io/npm/l/@wener/torrent
[torrent-size]: https://badgen.net/bundlephobia/minzip/@wener/torrent
[torrent-deps]: https://badgen.net/bundlephobia/dependency-count/@wener/torrent
[torrent-doc]: https://wode.vercel.app/docs/modules/_wener_torrent.html
[unpkg-repo]: https://github.com/wenerme/wode/tree/main/packages/unpkg
[unpkg-npm]: https://www.npmjs.com/package/@wener/unpkg
[unpkg-version]: https://img.shields.io/npm/v/@wener/unpkg
[unpkg-license]: https://img.shields.io/npm/l/@wener/unpkg
[unpkg-size]: https://badgen.net/bundlephobia/minzip/@wener/unpkg
[unpkg-deps]: https://badgen.net/bundlephobia/dependency-count/@wener/unpkg
[unpkg-doc]: https://wode.vercel.app/docs/modules/_wener_unpkg.html
[wode-repo]: https://github.com/wenerme/wode/tree/main/packages/wode
[wode-npm]: https://www.npmjs.com/package/@wener/wode
[wode-version]: https://img.shields.io/npm/v/@wener/wode
[wode-license]: https://img.shields.io/npm/l/@wener/wode
[wode-size]: https://badgen.net/bundlephobia/minzip/@wener/wode
[wode-deps]: https://badgen.net/bundlephobia/dependency-count/@wener/wode
[wode-doc]: https://wode.vercel.app/docs/modules/_wener_wode.html

- Site
  - [wener.me](https://wener.me)
    - Blog
    - Github [wenerme/wener](https://github.com/wenerme/wener)
  - [wode.vercel.app](https://wode.vercel.app/)
    - Playground
    - GitHub [wenerme/wode](https://github.com/wenerme/wode)
  - [apis.wener.me](https://apis.wener.me/)
    - APIs playground with docs & stories
    - GitHub [wenerme/apis](https://github.com/wenerme/apis)
- Library
  - [@wener/reaction](https://www.npmjs.com/package/@wener/reaction) - ![VERSION](https://img.shields.io/npm/v/@wener/reaction) - ![LICENSE](https://img.shields.io/npm/l/@wener/reaction)
    - [Docs](https://wode.vercel.app/docs/modules/_wener_reaction.html)
    - React hooks, render, logical components
    - helpful typing
    - some external minimal helpful utils
      - reduce packages
  - [@wener/utils](https://www.npmjs.com/package/@wener/utils) - ![VERSION](https://img.shields.io/npm/v/@wener/utils) - ![LICENSE](https://img.shields.io/npm/l/@wener/utils)
    - [Docs](https://wode.vercel.app/docs/modules/_wener_utils.html)
    - utils for daily use
    - zero dependencies
  - [@wener/system](https://www.npmjs.com/package/@wener/system) - ![VERSION](https://img.shields.io/npm/v/@wener/system) - ![LICENSE](https://img.shields.io/npm/l/@wener/system)
    - [Docs](https://wode.vercel.app/docs/modules/_wener_system.html)
    - Utils for systemjs
    - make systemjs work with npm & package.json
  - [@wener/ui](https://www.npmjs.com/package/@wener/ui) - ![VERSION](https://img.shields.io/npm/v/@wener/ui) - ![LICENSE](https://img.shields.io/npm/l/@wener/ui)
    - [Storybook](https://apis.wener.me/storybook/@wener/ui)
    - [Document](https://apis.wener.me/docs/@wener/ui/)
  - [@wener/tinyrpc](https://www.npmjs.com/package/@wener/tinyrpc) - ![VERSION](https://img.shields.io/npm/v/@wener/tinyrpc) - ![LICENSE](https://img.shields.io/npm/l/@wener/tinyrpc)
    - [Document](https://apis.wener.me/docs/@wener/tinyrpc/)
  - [rjsf-antd-theme](https://www.npmjs.com/package/rjsf-antd-theme) - ![VERSION](https://img.shields.io/npm/v/rjsf-antd-theme) - ![LICENSE](https://img.shields.io/npm/l/rjsf-antd-theme)
    - Ant Design Theme for React Json Schema Form
    - [Storybook](https://apis.wener.me/storybook/rjsf-antd-theme)
    - [Document](https://apis.wener.me/docs/rjsf-antd-theme/)

<!-- LINK:END -->
