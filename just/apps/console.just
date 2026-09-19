set positional-arguments := true

[no-cd]
dev port=env_var_or_default("PORT", "3000"):
    NODE_ENV=development pnpm exec vp dev --port "$1" --host

[no-cd]
build: build-web web-image

[no-cd]
build-web: write-version build-web-vite

[no-cd]
build-web-vite:
    NODE_ENV=production pnpm exec vp build

[no-cd]
write-version:
    pnpm exec tsx ./src/scripts/write-version.ts

[no-cd]
web-image: web-image-static

[no-cd]
web-image-static:
    mkdir -p builds/web-static/app
    rsync -av dist/ builds/web-static/app/ --delete

[no-cd]
test *args:
    pnpm exec vp test run --config vitest.config.ts "$@"
