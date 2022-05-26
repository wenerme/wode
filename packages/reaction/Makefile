clean:
	rm -rf src/**/*.{js,js.map} dist/* lib/* index.js

dev: build
	esbuild --format=esm --outdir=lib/esm --target=chrome80 src/index.ts src/**/*.{ts,tsx} --watch

publish: clean prepublish
	npm publish --registry https://registry.npmjs.org

build:
	npx esbuild --format=esm --outdir=lib/esm --target=chrome80 src/index.ts src/**/*.{ts,tsx}

prepublish: build bundle
	npx tsc -m es2015 --outDir lib/esm --emitDeclarationOnly
	npx tsc -m commonjs --outDir lib/cjs
	npx tsc -m esnext --outDir lib/esnext

# --minify
FLAGS:=src/index.ts --external:{react,react-dom,prop-types} --define:process.env.NODE_ENV=\"production\" --target=chrome80 --sourcemap --bundle
bundle:
	rm -rf dist/*
	npx esbuild --format=iife --outfile=dist/wener-reaction.js $(FLAGS)
	npx esbuild --format=cjs --outfile=dist/wener-reaction.cjs $(FLAGS)
	npx esbuild --format=esm --outfile=dist/wener-reaction.mjs $(FLAGS)

# Check bundle
#-grep '^// ' dist/wener-reaction.esm.js | grep node_modules

fmt:
	npx prettier src -w

lint:
	tsc --pretty --noEmit
