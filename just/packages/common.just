import '../package.just'

[no-cd]
build:
    just -f "{{ justfile_directory() }}/../package.just" package-swc-build lib false json-css false

[no-cd]
icons:
    pnpm dlx svgo -f src/icons/svg/icons -f src/icons/svg/brands --config ./svgo.config.mjs --pretty
    pnpm dlx @svgr/cli --typescript --out-dir src/icons/ --memo --no-prettier --no-index -- src/icons/svg/icons src/icons/svg/brands
    ls src/icons/*.tsx | xargs -n 1 basename -s .tsx | xargs -I {} echo "export { default as {} } from './{}'" > src/icons/index.ts
    pnpm exec biome format --write src/icons/*.tsx

[no-cd]
svgo:
    pnpm dlx svgo -f public/assets/images/svg/brands --config svgo.config.json --pretty
    pnpm dlx svgo -f public/assets/images/svg/tokens --config svgo.config.json --pretty
