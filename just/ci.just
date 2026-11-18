set positional-arguments
set working-directory := '..'

check:
    #!/usr/bin/env bash
    set -euo pipefail
    pnpm install --frozen-lockfile
    for file in justfile just/*.just packages/*/justfile apps/*/justfile apps/*/*.just; do
        just --unstable --fmt --check --justfile "$file"
    done
    just buf::fmt
    just buf::lint
    just buf::gen
    git diff --check
    git diff --exit-code -- proto buf.yaml buf.gen.yaml packages/common/src/protos
    just --justfile packages/wener-miniquery/justfile generate-check
    pnpm exec biome lint .
    pnpm -r --if-present run typecheck
    just ci::test

# Without a base, run the complete offline baseline. For PR-like selection:

# just ci::test --base origin/main
test *args:
    node scripts/run-ci-tests.mjs baseline "$@"
