# Shared Vite recipes are imported by the root justfile. Package-local reuse goes
# through just/package.just, whose recipes are explicitly marked [no-cd].

fmt *args:
    #!/usr/bin/env bash
    set -euo pipefail
    if (($# == 0)); then set -- '**/*.{ts,tsx,md}'; fi
    pnpm exec biome format --write "$@" '!packages/common/src/protos/**'

lint *args:
    pnpm exec biome lint "$@"

lint-fix *args:
    pnpm exec biome lint --write "$@"

check *args:
    pnpm exec biome check . "$@"

typecheck:
    pnpm -r --if-present run typecheck

vitest-test *args:
    pnpm exec vitest run "$@"
