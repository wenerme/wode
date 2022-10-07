# Node starter conf

Common setup and configs

```bash
# Root Project
# ====================
# Basic
pnpm add -Dw \
  @wener/wode \ 
  tsx typescript @types/node \
  prettier prettier-plugin-pkg @trivago/prettier-plugin-sort-imports \ 
  eslint
  
# Bundling
pnpm add -Dw globby rollup rollup-plugin-esbuild rollup-plugin-visualizer @rollup/plugin-commonjs @rollup/plugin-json @rollup/plugin-node-resolve

# Frontend
pnpm add -Dw prettier-plugin-tailwindcss

pnpm add -D eslint-plugin-react@latest eslint-config-standard-with-typescript@latest @typescript-eslint/eslint-plugin@^5.0.0 eslint@^8.0.1 eslint-plugin-import@^2.25.2 eslint-plugin-n@^15.0.0 eslint-plugin-promise@^6.0.0 typescript@*
```
