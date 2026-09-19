set positional-arguments := true

# Standalone, reusable in packages with src/apps/<name>/main.ts.
[no-cd]
list:
    #!/usr/bin/env bash
    set -euo pipefail
    find src/apps -mindepth 2 -maxdepth 2 -type f \( -name main.ts -o -name main.bun.ts \) -print |
        while IFS= read -r entry; do basename "$(dirname "$entry")"; done |
        LC_ALL=C sort -u

[no-cd]
[private]
_validate server:
    #!/usr/bin/env bash
    set -euo pipefail
    if [[ ! "$1" =~ ^[A-Za-z0-9_-]+$ ]] || [[ ! -f "src/apps/$1/main.ts" && ! -f "src/apps/$1/main.bun.ts" ]]; then
        printf 'Unknown server %q. Available servers:\n' "$1" >&2
        just --justfile {{ quote(justfile()) }} list >&2
        exit 2
    fi

[no-cd]
swc-build:
    pnpm exec swc ./src -d ./dist/out

[no-cd]
build server: (_validate server) swc-build
    SERVER="$1" pnpm exec tsx src/scripts/bundle.esbuild.ts

[no-cd]
build-all:
    #!/usr/bin/env bash
    set -euo pipefail
    servers=$(just --justfile {{ quote(justfile()) }} list | paste -sd, -)
    if [[ -z "$servers" ]]; then
        printf 'No server entrypoints found under src/apps.\n' >&2
        exit 2
    fi
    SERVER="$servers" pnpm exec tsx src/scripts/bundle.esbuild.ts

[no-cd]
dev server *args: (_validate server)
    #!/usr/bin/env bash
    set -euo pipefail
    server="$1"
    shift
    if [[ -f "src/apps/$server/main.bun.ts" ]]; then
        NODE_ENV=development exec bun --watch "src/apps/$server/main.bun.ts" "$@"
    fi
    NODE_ENV=development exec pnpm node --loader ts-node/esm --watch "src/apps/$server/main.ts" "$@"

[no-cd]
debug server *args: (_validate server)
    #!/usr/bin/env bash
    set -euo pipefail
    server="$1"
    shift
    NODE_ENV=development exec pnpm node --inspect --loader ts-node/esm "src/apps/$server/main.ts" "$@"

[no-cd]
run server *args: (build server)
    #!/usr/bin/env bash
    set -euo pipefail
    server="$1"
    shift
    NODE_ENV=production exec node "dist/apps/$server/main.mjs" "$@"

# Explicit targets only: historical Bake defaults include retired entrypoints.
[no-cd]
[private]
_image-target server: (_validate server)
    test -f "builds/$1/Dockerfile"
    cd builds && docker buildx bake --print "$1" >/dev/null

[no-cd]
image-build-prepare server: (_validate server)
    test -f "dist/apps/$1/main.mjs"
    mkdir -p "builds/$1/app"
    rsync -a --delete "dist/apps/$1/" "builds/$1/app/"
    if test -d public; then mkdir -p "builds/$1/app/public"; rsync -a --delete public/ "builds/$1/app/public/"; fi

[no-cd]
image server: (_image-target server) (build server) (image-build-prepare server)
    cd builds && docker buildx bake --load "$1"

[no-cd]
deploy server: (_image-target server) (build server) (image-build-prepare server)
    cd builds && docker buildx bake --push "$1"
