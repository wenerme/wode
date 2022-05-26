PKG_NAME:=$(shell basename $(PWD))

info:
	@echo $(PKG_NAME)
	@echo $(shell jq -r '.name' package.json) v$(shell jq -r '.version' package.json)

clean:
	rm -vrf src/**/*.{js,js.map} dist/* lib/* index.js

dev: build
	esbuild --format=esm --outdir=lib/esm --target=chrome80 src/index.ts src/**/*.ts --watch

publish: clean prepublish
	npm publish --registry https://registry.npmjs.org

build:
	npx esbuild --format=esm --outdir=lib/esm --target=chrome80 src/index.ts src/**/*.ts

prepublish: build bundle
	npx tsc -m es2015 --outDir lib/esm --emitDeclarationOnly
	npx tsc -m commonjs --outDir lib/cjs
	npx tsc -m esnext --outDir lib/esnext

# --minify
FLAGS:=src/index.ts --external:{react,react-dom,prop-types} --define:process.env.NODE_ENV=\"production\" --target=chrome80 --sourcemap --bundle
bundle:
	rm -rf dist/*
	npx esbuild --format=iife --outfile=dist/$(PKG_NAME).js $(FLAGS)
	npx esbuild --format=cjs --outfile=dist/$(PKG_NAME).cjs $(FLAGS)
	npx esbuild --format=esm --outfile=dist/$(PKG_NAME).mjs $(FLAGS)

# Check bundle
#-grep '^// ' dist/$(PKG_NAME).esm.js | grep node_modules

fmt:
	npx prettier src -w

lint:
	tsc --pretty --noEmit
