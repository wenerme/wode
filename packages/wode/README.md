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
```
