set positional-arguments
set working-directory := '..'

# Protobuf recipes operate on the canonical root `proto/` tree: `just buf::gen`.

fmt *args:
    buf format ./proto --write "$@"

lint *args:
    buf lint "$@"

gen *args:
    buf generate "$@"
    pnpm node scripts/normalize-generated-protos.mjs

stats *args:
    buf stats "$@"
