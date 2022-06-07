PKG_NAME:=$(shell jq -r '.name' package.json | tr -d '@' | tr '/' '-')

info:
	@echo $(PKG_NAME)
	@echo $(shell jq -r '.name' package.json) v$(shell jq -r '.version' package.json)

clean:
	rm -rf dist/* lib/*

FLAGS:=src/index.ts --external:{react,react-dom,prop-types,classnames,@*,markdown-it,prosemirror*} --define:process.env.NODE_ENV=\"production\" --target=chrome90 --sourcemap --bundle
build: bundle
	pnpm exec esbuild --format=esm --outdir=lib/esm --target=chrome90 src/index.ts src/**/*.ts
	pnpm exec tsc --outDir lib/esm

bundle:
	pnpm exec esbuild --format=cjs --outfile=dist/$(PKG_NAME).cjs.js $(FLAGS)
	pnpm exec esbuild --format=esm --outfile=dist/$(PKG_NAME).esm.js $(FLAGS)
	-grep '^// ' dist/$(PKG_NAME).esm.js | grep node_modules
