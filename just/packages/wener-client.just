import '../package.just'

[no-cd]
build:
    just -f "{{ justfile_directory() }}/../package.just" package-swc-build lib false json false

[no-cd]
publish: build
    pnpm version patch --no-workspaces-update
    just -f "{{ justfile_directory() }}/../package.just" package-publish

[no-cd]
run-bun:
    docker run --platform linux/amd64 -it --rm -v "$(git rev-parse --show-toplevel):/host" -w "/host/$(realpath --relative-to "$(git rev-parse --show-toplevel)" "$PWD")" -p 3000:3000 --name bun --entrypoint bash oven/bun:debian
