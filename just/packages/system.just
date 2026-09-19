import '../package.just'

[no-cd]
build:
    just -f "{{ justfile_directory() }}/../package.just" package-swc-build lib true none true
    just -f "{{ justfile_directory() }}/../package.just" package-swc-build dist/cjs true none true cjs
    printf '{"type":"commonjs"}\n' > dist/cjs/package.json

[no-cd]
dev:
    pnpm exec swc ./src -d ./lib --strip-leading-paths --copy-files --ignore '**/*.test.ts' --watch
