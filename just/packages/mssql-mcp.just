import '../package.just'

[no-cd]
publish:
    pnpm version patch --no-workspaces-update
    just -f "{{ justfile_directory() }}/../package.just" package-publish
