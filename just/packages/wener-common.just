import '../package.just'

[no-cd]
build:
    just -f "{{ justfile_directory() }}/../package.just" package-swc-build lib false json-css false

[no-cd]
publish: build
    just -f "{{ justfile_directory() }}/../package.just" package-publish
