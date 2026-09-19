info:
    #!/usr/bin/env bash
    set -euo pipefail
    printf 'Repository: %s\n' "$(basename "$(git rev-parse --show-toplevel)")"
    printf 'Branch:     %s\n' "$(git branch --show-current)"
    printf 'Commit:     %s\n' "$(git rev-parse --short HEAD)"
    printf 'Node:       %s\n' "$(node --version)"
    printf 'pnpm:       %s\n' "$(pnpm --version)"
    printf 'just:       %s\n' "$(just --version)"

install:
    pnpm install --frozen-lockfile

dev *args:
    pnpm turbo run dev --parallel "$@"

build *args:
    pnpm turbo run build --filter='!@wener/system' "$@"

test *args:
    pnpm turbo run test "$@"

clean *args:
    pnpm turbo run clean --parallel "$@"

outdated:
    pnpm outdated -r
