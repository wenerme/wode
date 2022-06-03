# wode

Wener Node Monorepo

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
- packages
  - reaction - [@wener/reaction](https://www.npmjs.com/package/@wener/reaction)
    - React hooks & utils
  - utils - [@wener/utils](https://www.npmjs.com/package/@wener/utils)
    - Typescript
    - Zero Dependencies
  - ethers - WIP
    - Web3 utils

## Dev

- Node 16+
- turbo

```bash
npx turbo run build --filter=@wener/demo
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
