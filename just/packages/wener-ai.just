import '../package.just'

[no-cd]
build: package-swc-build

[no-cd]
publish:
    just -f "{{ justfile_directory() }}/../package.just" package-publish
