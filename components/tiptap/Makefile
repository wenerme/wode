build:
	pnpm exec esbuild --format=esm --outdir=lib/esm --target=chrome90 src/index.ts src/**/*.ts
	pnpm exec tsc --outDir lib/esm --emitDeclarationOnly --declaration
