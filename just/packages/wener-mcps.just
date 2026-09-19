import '../package.just'

[no-cd]
build:
    pnpm build
    just -f "{{ justfile_directory() }}/../package.just" package-swc-build lib false none false
