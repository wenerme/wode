ci:
    #!/usr/bin/env bash
    set -euo pipefail
    pnpm install --frozen-lockfile
    for file in justfile just/*.just just/apps/*.just just/packages/*.just; do
        just --unstable --fmt --check --justfile "$file"
    done
    just buf-fmt
    just buf-lint
    just buf-gen
    git diff --check
    git diff --exit-code -- proto buf.yaml buf.gen.yaml packages/common/src/protos
    pnpm exec biome lint .
    pnpm -r --if-present run typecheck
    just test-ci

# Without a base, run the complete offline baseline. For PR-like selection:

# just test-ci --base origin/main
test-ci *args:
    node scripts/run-ci-tests.mjs baseline "$@"
