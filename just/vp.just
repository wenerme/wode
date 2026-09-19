# Vite+ recipes are imported by the root justfile. Package-local reuse goes
# through just/package.just, whose recipes are explicitly marked [no-cd].

fmt *args:
    #!/usr/bin/env bash
    set -euo pipefail
    if (($# == 0)); then set -- '**/*.{ts,tsx,md}'; fi
    pnpm exec vp fmt "$@" '!packages/common/src/protos/**'

lint *args:
    pnpm exec vp lint "$@"

lint-fix *args:
    pnpm exec vp lint --fix "$@"

check *args:
    pnpm exec vp check "$@"

typecheck:
    pnpm -r --if-present run typecheck

vp-test *args:
    pnpm exec vp test run "$@"
