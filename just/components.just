# The component lab is intentionally addressed through explicit names so that
# package-local `dev`, `build`, and `test` recipes never collide with root ones.

components-dev *args:
    pnpm -C apps/components dev "$@"

components-build *args:
    pnpm -C apps/components build "$@"

components-storybook *args:
    pnpm -C apps/components storybook "$@"

components-registry-build *args:
    pnpm -C apps/components registry:build "$@"

components-registry-check *args:
    pnpm -C apps/components registry:check "$@"

components-consumer-check *args:
    pnpm -C apps/components registry:consumer-check -- "$@"

components-verify *args:
    pnpm -C apps/components verify "$@"
