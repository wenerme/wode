ci:
    #!/usr/bin/env bash
    set -euo pipefail
    pnpm install --frozen-lockfile
    while IFS= read -r -d '' file; do
        just --unstable --fmt --check --justfile "$file"
    done < <(find . -type f \( -name justfile -o -name '*.just' \) \
        -not -path './.git/*' -not -path './node_modules/*' -not -path './.agents/*' -print0 | sort -z)
    just buf-fmt
    just buf-lint
    just buf-gen
    git diff --check
    git diff --exit-code -- proto buf.yaml buf.gen.yaml packages/common/src/protos
    just check
    just test-ci

# Without a base, run the complete offline baseline. For PR-like selection:

# just test-ci --base origin/main
test-ci *args:
    node scripts/run-ci-tests.mjs baseline "$@"
