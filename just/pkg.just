set positional-arguments := true

# Generic package recipes. Package and application justfiles import this file.

[no-cd]
pkg +args:
    #!/usr/bin/env bash
    set -euo pipefail
    repo_root="$(git rev-parse --show-toplevel)"
    exec just --justfile "$repo_root/just/pkg.just" "$@"

[no-cd]
fmt *args:
    #!/usr/bin/env bash
    set -euo pipefail
    repo_root="$(git rev-parse --show-toplevel)"
    ignore_args=()
    for ignore_file in "$repo_root/.gitignore" "$repo_root/.prettierignore" .gitignore .prettierignore "$(git rev-parse --git-path info/exclude)"; do
        if test -f "$ignore_file"; then ignore_args+=(--ignore-path "$ignore_file"); fi
    done
    if (($# == 0)); then set -- .; fi
    exec bun fmt --no-script --config "$repo_root/.prettierrc.json" "${ignore_args[@]}" "$@"

[no-cd]
fmt-check *args:
    #!/usr/bin/env bash
    set -euo pipefail
    repo_root="$(git rev-parse --show-toplevel)"
    ignore_args=()
    for ignore_file in "$repo_root/.gitignore" "$repo_root/.prettierignore" .gitignore .prettierignore "$(git rev-parse --git-path info/exclude)"; do
        if test -f "$ignore_file"; then ignore_args+=(--ignore-path "$ignore_file"); fi
    done
    if (($# == 0)); then set -- .; fi
    exec bun fmt --no-script --config "$repo_root/.prettierrc.json" "${ignore_args[@]}" --check "$@"

[no-cd]
lint *args:
    pnpm exec biome lint "$@"

[no-cd]
lint-fix *args:
    pnpm exec biome lint --write "$@"

[no-cd]
typecheck *args:
    bun check --no-script "$@"

[no-cd]
test *args:
    #!/usr/bin/env bash
    set -euo pipefail
    config=''
    for candidate in vitest.config.ts vitest.config.mts vitest.config.js vitest.config.mjs vite.config.ts vite.config.mts vite.config.js vite.config.mjs; do
        if test -f "$candidate"; then
            config="$candidate"
            break
        fi
    done
    if test -n "$config"; then
        exec pnpm exec vitest run --config "$PWD/$config" "$@"
    fi
    repo_root="$(git rev-parse --show-toplevel)"
    root_config="$repo_root/vitest.config.ts"
    if test -f "$root_config"; then
        package_name="$(node -p "require('./package.json').name")"
        exec pnpm --dir "$repo_root" exec vitest run --config "$root_config" --project "$package_name" "$@"
    fi
    printf 'No Vitest/Vite test configuration found in %s.\n' "$PWD" >&2
    exit 2

[no-cd]
clean:
    rm -rf .next .turbo node_modules/.cache dist lib out storybook-static

[no-cd]
swc-build output='lib' copy_files='false' assets='none' ignore_tests='false' module='esm':
    #!/usr/bin/env bash
    set -euo pipefail
    output="${1:-lib}"
    copy_files="${2:-false}"
    assets="${3:-none}"
    ignore_tests="${4:-false}"
    module="${5:-esm}"
    if [[ ! "$output" =~ ^(lib|dist)(/[A-Za-z0-9_-]+)*$ ]]; then
        printf 'Invalid package artifact output: %s\n' "$output" >&2
        exit 2
    fi
    case "$copy_files" in true|false) ;; *) printf 'Invalid copy-files value: %s\n' "$copy_files" >&2; exit 2 ;; esac
    case "$ignore_tests" in true|false) ;; *) printf 'Invalid ignore-tests value: %s\n' "$ignore_tests" >&2; exit 2 ;; esac
    case "$assets" in none|json|css|json-css) ;; *) printf 'Unknown asset mode: %s\n' "$assets" >&2; exit 2 ;; esac
    case "$module" in esm|cjs) ;; *) printf 'Unknown module mode: %s\n' "$module" >&2; exit 2 ;; esac
    staging_root='.just-package-staging'
    staging="$staging_root/${output//\//-}.$$"
    backup="$staging_root/${output//\//-}.$$.backup"
    mkdir -p "$staging_root"
    rm -rf -- "$staging"
    restore_on_exit() {
        status=$?
        if test -e "$backup" && ! test -e "$output"; then mv -- "$backup" "$output"; fi
        rm -rf -- "$staging" "$backup"
        rmdir "$staging_root" 2>/dev/null || true
        exit "$status"
    }
    trap restore_on_exit EXIT
    swc_args=(./src -d "$staging" --strip-leading-paths)
    if [[ "$copy_files" == true ]]; then swc_args+=(--copy-files); fi
    if [[ "$ignore_tests" == true ]]; then swc_args+=(--ignore '**/*.test.ts'); fi
    if [[ "$module" == cjs ]]; then swc_args+=(-C module.type=commonjs); fi
    pnpm exec swc "${swc_args[@]}"
    pnpm exec ts-add-js-extension --dir="$staging"
    case "$assets" in
        json-css) rsync ./src/ "$staging/" -a --include='*.css' --include='*.json' --include='*/' --exclude='*' ;;
        json) rsync ./src/ "$staging/" -a --include='*.json' --include='*/' --exclude='*' ;;
        css) rsync ./src/ "$staging/" -a --include='*.css' --include='*/' --exclude='*' ;;
        none) ;;
    esac
    mkdir -p "$(dirname "$output")"
    if test -e "$output"; then rm -rf -- "$backup"; mv -- "$output" "$backup"; fi
    if ! mv -- "$staging" "$output"; then
        if test -e "$backup"; then mv -- "$backup" "$output"; fi
        exit 1
    fi

[no-cd]
pkg-publish *args:
    pnpm publish --registry https://registry.npmjs.org --access public --no-git-checks "$@"
