import '../package.just'

[no-cd]
build:
    just -f "{{ justfile_directory() }}/../package.just" package-swc-build lib true none true

[no-cd]
publish: build
    pnpm version patch --no-workspaces-update
    just -f "{{ justfile_directory() }}/../package.just" package-publish
