
[no-cd]
fmt *args:
	pwd
	pnpm biome format --write ./src {{args}}

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
