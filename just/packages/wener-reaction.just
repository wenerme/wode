import '../package.just'

[no-cd]
bundle-system:
    pnpm exec rollup -i src/index.ts -f system -p typescript -o dist/wener-reaction.system.js

[no-cd]
check-syntax:
    ! grep '[?][?]' lib/**/*.js
    ! grep '[?][.]' lib/**/*.js

[no-cd]
dev:
    pnpm exec swc ./src -d ./lib --strip-leading-paths --watch

[no-cd]
build:
    just -f "{{ justfile_directory() }}/../package.just" package-swc-build lib false css false

[no-cd]
publish: build
    pnpm version patch --no-workspaces-update
    just -f "{{ justfile_directory() }}/../package.just" package-publish
