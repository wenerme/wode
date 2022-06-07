PKG_NAME=$(shell jq -r '.name' package.json | tr -d '@' | tr '/' '-')
REPO_ROOT ?= $(shell git rev-parse --show-toplevel)

ifneq ("$(wildcard $(REPO_ROOT)/pnpm-lock.yaml)","")
    EXEC=pnpm exec
	PM=pnpm
else
	EXEC=$(EXEC)
	PM=npm
endif

info:
	@echo $(PKG_NAME)
	@echo $(shell jq -r '.name' package.json) v$(shell jq -r '.version' package.json)

clean:
	rm -rf src/**/*.{js,js.map} dist/* lib/* index.js

dev: build
	esbuild --format=esm --outdir=lib/esm --target=chrome80 src/index.ts src/**/*.ts --watch

publish:  prepublish
	$(PM) publish --registry https://registry.npmjs.org

build:
	$(EXEC) esbuild --format=esm --outdir=lib/esm --target=chrome80 src/index.ts src/**/*.ts

prepublish: clean test build bundle
	$(EXEC) tsc -m es2015 --outDir lib/esm --emitDeclarationOnly
	$(EXEC) tsc -m commonjs --outDir lib/cjs
	$(EXEC) tsc -m esnext --outDir lib/esnext

# --minify
FLAGS:=src/index.ts --external:{react,react-dom,prop-types} --define:process.env.NODE_ENV=\"production\" --target=chrome80 --sourcemap --bundle
bundle:
	rm -rf dist/*
	$(EXEC) esbuild --format=iife --outfile=dist/$(PKG_NAME).js $(FLAGS)
	$(EXEC) esbuild --format=cjs --outfile=dist/$(PKG_NAME).cjs $(FLAGS)
	$(EXEC) esbuild --format=esm --outfile=dist/$(PKG_NAME).mjs $(FLAGS)

# Check bundle
#-grep '^// ' dist/$(PKG_NAME).esm.js | grep node_modules

fmt:
	$(EXEC) prettier src -w

lint:
	tsc --pretty --noEmit

test:
	[ -e jest.config.js ] && $(EXEC) jest
