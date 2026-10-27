# Shared toolchain recipes are imported by the root justfile. Package-local reuse goes
# through just/pkg.just, whose recipes are explicitly marked [no-cd].

fmt *args:
    bun fmt --no-script --config .prettierrc.json "$@"

# Gradually enforce the new formatter without rewriting unrelated source.
fmt-check *args:
    #!/usr/bin/env bash
    set -euo pipefail
    if (($# == 0)); then
        base="${WODE_FORMAT_BASE:-${WODE_TEST_BASE:-origin/develop}}"
        if [[ -z "$base" || "$base" =~ ^0+$ ]]; then
            base=origin/develop
        fi
        if git rev-parse --verify "$base^{commit}" >/dev/null 2>&1; then
            base="$(git merge-base HEAD "$base")"
        elif git rev-parse --verify origin/develop^{commit} >/dev/null 2>&1; then
            base="$(git merge-base HEAD origin/develop)"
        else
            base="$(git rev-parse HEAD^ 2>/dev/null || git rev-parse HEAD)"
        fi
        set -- "--changed=$base"
    fi
    exec bun fmt --no-script --config .prettierrc.json --check "$@"

lint *args:
    pnpm exec biome lint "$@"

lint-fix *args:
    pnpm exec biome lint --write "$@"

check *args:
    just fmt-check "$@"
    just lint
    just typecheck

typecheck *args:
    bun check --no-script -b "$@"

[no-cd]
pkg +args:
    #!/usr/bin/env bash
    set -euo pipefail
    repo_root="$(git rev-parse --show-toplevel)"
    exec just --justfile "$repo_root/just/pkg.just" "$@"

vitest-test *args:
    pnpm exec vitest run "$@"
