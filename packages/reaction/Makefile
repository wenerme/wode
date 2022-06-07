PKG_NAME:=$(shell basename $(PWD))

info:
	@echo $(PKG_NAME)
	@echo $(shell jq -r '.name' package.json) v$(shell jq -r '.version' package.json)

clean:
	rm -rf src/**/*.{js,js.map} dist/* lib/* index.js

dev: build
	esbuild --format=esm --outdir=lib/esm --target=chrome80 src/index.ts src/**/*.{ts,tsx} --watch

publish: clean prepublish
	npm publish --registry https://registry.npmjs.org

build:
	pnpm exec esbuild --format=esm --outdir=lib/esm --target=chrome80 src/index.ts src/**/*.{ts,tsx}

prepublish: build bundle
	pnpm exec tsc -m es2015 --outDir lib/esm --emitDeclarationOnly
	pnpm exec tsc -m commonjs --outDir lib/cjs
	pnpm exec tsc -m esnext --outDir lib/esnext

# --minify
FLAGS:=src/index.ts --external:{react,react-dom,prop-types} --define:process.env.NODE_ENV=\"production\" --target=chrome80 --sourcemap --bundle
bundle:
	rm -rf dist/*
	pnpm exec esbuild --format=iife --outfile=dist/$(PKG_NAME).js $(FLAGS)
	pnpm exec esbuild --format=cjs --outfile=dist/$(PKG_NAME).cjs $(FLAGS)
	pnpm exec esbuild --format=esm --outfile=dist/$(PKG_NAME).mjs $(FLAGS)

# Check bundle
#-grep '^// ' dist/$(PKG_NAME).esm.js | grep node_modules

fmt:
	pnpm exec prettier src -w

lint:
	tsc --pretty --noEmit
