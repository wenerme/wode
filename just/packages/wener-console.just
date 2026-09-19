import '../package.just'

[no-cd]
build:
    just -f "{{ justfile_directory() }}/../package.just" package-swc-build lib true none false

[no-cd]
publish: build
    pnpm version patch --no-workspaces-update
    just -f "{{ justfile_directory() }}/../package.just" package-publish

[no-cd]
publish-next: build
    pnpm version prerelease --preid=beta --no-workspaces-update
    just -f "{{ justfile_directory() }}/../package.just" package-publish --tag next

[no-cd]
publint:
    pnpm dlx publint

[no-cd]
sync-css:
    rsync ./src/ ./lib/ -avz --include='*.css' --include='*/' --exclude='*'

[no-cd]
icons:
    pnpm dlx svgo -f src/icons/svg/icons -f src/icons/svg/brands --config ./svgo.config.mjs --pretty
    pnpm dlx @svgr/cli --typescript --out-dir src/icons/ --memo --no-prettier --no-index -- src/icons/svg/icons src/icons/svg/brands
    ls src/icons/*.tsx | xargs -n 1 basename -s .tsx | xargs -I {} echo "export { default as {} } from './{}'" > src/icons/index.ts
    pnpm exec vp fmt src/icons/*.tsx
