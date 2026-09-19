ci:
    #!/usr/bin/env bash
    set -euo pipefail
    pnpm install --frozen-lockfile
    just tasks-check
    just buf-fmt
    just buf-lint
    just buf-gen
    git diff --check
    git diff --exit-code -- proto buf.yaml buf.gen.yaml packages/common/src/protos
    pnpm exec biome check . --diagnostic-level=error --max-diagnostics=1000
    pnpm -r --if-present run typecheck
    pnpm exec vp test run packages/wener-utils/src/langs/getObjectId.test.ts --config packages/wener-utils/vitest.config.ts
    pnpm exec vp test run packages/wener-server/src/entity/defineEntity.test.ts packages/wener-server/src/entity/defineEntitySchemaClass.test.ts
    pnpm exec vp test run packages/wener-common/src/fs/server/dbfs.test.ts

# Validate the task runner without starting apps or publishing artifacts.
tasks-check:
    #!/usr/bin/env bash
    set -euo pipefail
    for file in justfile just/*.just just/apps/*.just just/packages/*.just; do
        just --unstable --fmt --check --justfile "$file"
    done
    pnpm run test:tasks
