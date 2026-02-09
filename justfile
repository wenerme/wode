all-fmt:
	pnpm -r exec just fmt

[no-cd]
fmt *args:
	pwd
	pnpm biome format --write ./src package.json {{args}}

[no-cd]
lint *args:
	pwd
	pnpm biome lint ./src {{args}}

[no-cd]
lint-fix *args:
	pwd
	pnpm biome lint --write ./src {{args}}

[no-cd]
typecheck *args:
	pwd
	pnpm tsgo -p tsconfig.json --skipLibCheck --maxNodeModuleJsDepth 0 --noEmit {{args}}

[no-cd]
publint:
	pwd
	bunx publint

[no-cd]
lib-build:
	-rm -rf lib/*
	pnpm swc ./src -d ./lib --strip-leading-paths --copy-files --ignore '**/*.test.ts'
	bunx ts-add-js-extension --dir=lib

[no-cd]
lib-publish: lib-build
	pnpm version patch --no-workspaces-update
	pnpm publish --registry https://registry.npmjs.org --access public --no-git-checks

[no-cd]
knip:
	bunx knip
