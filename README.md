# wode

Wener Node Monorepo

- apps
  - demo https://wode.vercel.app/
    - TipTap based Google Doc
      - Extensions
        - classNames, column-count, margin-{left,right,top,bottom}, line-height, font-size, text-indent, letter-spacing
        - video, indent
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
