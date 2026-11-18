set positional-arguments
set working-directory := '..'

# Workspace tooling. Package lifecycle tasks live in the package module.

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
