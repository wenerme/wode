import '../package.just'

[no-cd]
gen:
    pnpm node -e 'const fs = require("node:fs"); const p = JSON.parse(fs.readFileSync("package.json", "utf8")); fs.writeFileSync("src/const.gen.ts", `// Generated file - do not edit manually\nexport const VERSION = ${JSON.stringify(p.version)};\n`);'

[no-cd]
publish:
    #!/usr/bin/env bash
    set -euo pipefail
    pnpm version patch --no-git-tag-version
    just -f "{{ justfile_directory() }}/api-cli.just" gen
    pnpm publish --no-git-checks
