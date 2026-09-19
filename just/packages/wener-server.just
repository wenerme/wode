import '../package.just'

[no-cd]
build: package-swc-build

[no-cd]
publish: build
    pnpm version patch --no-workspaces-update
    just -f "{{ justfile_directory() }}/../package.just" package-publish

[no-cd]
next: build
    pnpm version prerelease --preid=beta --no-workspaces-update
    just -f "{{ justfile_directory() }}/../package.just" package-publish --tag next
