set positional-arguments := true

# Reuse from a directory containing docker-bake.hcl. Targets stay explicit.
[no-cd]
list:
    docker buildx bake --print

[no-cd]
build +targets:
    docker buildx bake --load "$@"

[no-cd]
push +targets:
    docker buildx bake --push "$@"
