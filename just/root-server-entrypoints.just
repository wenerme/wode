# Root orchestration wrappers. The standalone variant is just/server-entrypoints.just.

[no-cd]
server-list:
    cd "$(git rev-parse --show-toplevel)/apps/server" && just list

[no-cd]
server-build server:
    cd "$(git rev-parse --show-toplevel)/apps/server" && just build "$@"

[no-cd]
server-build-all:
    cd "$(git rev-parse --show-toplevel)/apps/server" && just build-all "$@"

[no-cd]
server-dev server *args:
    cd "$(git rev-parse --show-toplevel)/apps/server" && just dev "$@"

[no-cd]
server-debug server *args:
    cd "$(git rev-parse --show-toplevel)/apps/server" && just debug "$@"

[no-cd]
server-run server *args:
    cd "$(git rev-parse --show-toplevel)/apps/server" && just run "$@"

# Build and push one explicitly selected server image (never part of `ci`).
[no-cd]
server-deploy server:
    cd "$(git rev-parse --show-toplevel)/apps/server" && just deploy "$@"

[no-cd]
server-image server:
    cd "$(git rev-parse --show-toplevel)/apps/server" && just image "$@"
