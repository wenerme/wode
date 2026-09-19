# Protobuf recipes intentionally operate on the canonical root `proto/` tree.
# This file is imported by the repository justfile; use `just buf-*`.

buf-fmt *args:
    buf format ./proto --write "$@"

buf-lint *args:
    buf lint "$@"

buf-gen *args:
    buf generate "$@"
    pnpm node scripts/normalize-generated-protos.mjs

buf-stats *args:
    buf stats "$@"
