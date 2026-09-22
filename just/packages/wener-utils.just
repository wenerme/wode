import '../package.just'

[no-cd]
fmt-pkg:
    pnpm exec biome format --write package.json

[no-cd]
build: build-lib

[no-cd]
dev:
    pnpm exec swc ./src -d ./lib --strip-leading-paths --watch

[no-cd]
build-lib:
    pnpm exec node scripts/generate-slugify-data.mjs --check
    just -f "{{ justfile_directory() }}/../package.just" package-swc-build lib false json-css false

[no-cd]
check-syntax:
    ! grep '[?][?]' lib/**/*.js
    ! grep '[?][.]' lib/**/*.js

[no-cd]
publish: build-lib
    just -f "{{ justfile_directory() }}/../package.just" package-publish
