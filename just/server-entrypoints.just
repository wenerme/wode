set positional-arguments := true

# These wrappers are safe both when imported by the root justfile and when
# called directly with `just -f just/server-entrypoints.just ...`.

[no-cd]
server-list:
    cd "$(git rev-parse --show-toplevel)/apps/server" && just -f ../../just/servers.just list

[no-cd]
server-build server:
    cd "$(git rev-parse --show-toplevel)/apps/server" && just -f ../../just/servers.just build "$@"

[no-cd]
server-build-all:
    cd "$(git rev-parse --show-toplevel)/apps/server" && just -f ../../just/servers.just build-all "$@"

[no-cd]
server-dev server *args:
    cd "$(git rev-parse --show-toplevel)/apps/server" && just -f ../../just/servers.just dev "$@"

[no-cd]
server-debug server *args:
    cd "$(git rev-parse --show-toplevel)/apps/server" && just -f ../../just/servers.just debug "$@"

[no-cd]
server-run server *args:
    cd "$(git rev-parse --show-toplevel)/apps/server" && just -f ../../just/servers.just run "$@"

# Build and push one explicitly selected server image (never part of `ci`).
[no-cd]
server-deploy server:
    cd "$(git rev-parse --show-toplevel)/apps/server" && just -f ../../just/servers.just deploy "$@"

[no-cd]
server-image server:
    cd "$(git rev-parse --show-toplevel)/apps/server" && just -f ../../just/servers.just image "$@"
