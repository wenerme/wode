PKG_NAME=$(shell jq -r '.name' package.json | tr -d '@' | tr '/' '-')
REPO_ROOT ?= $(shell git rev-parse --show-toplevel)

ifneq ("$(wildcard $(REPO_ROOT)/pnpm-lock.yaml)","")
    EXEC=pnpm exec
	PM=pnpm
else
	EXEC=npx
	PM=npm
endif

info:
	@echo $(PKG_NAME)
	@echo $(shell jq -r '.name' package.json) v$(shell jq -r '.version' package.json)
	@echo $(PM) $(shell $(PM) -v)

clean:
	rm -rf dist/* lib/*

build:
	$(EXEC) esbuild --format=esm --outdir=lib/esm --target=chrome90 src/index.ts src/**/*.ts
	$(EXEC) esbuild --format=cjs --outdir=lib/cjs --target=chrome90 src/index.ts src/**/*.ts

FLAGS:=src/index.ts --external:{react,react-dom,prop-types,classnames,@*,markdown-it,prosemirror*} --define:process.env.NODE_ENV=\"production\" --target=chrome90 --sourcemap --bundle
bundle:
	$(EXEC) esbuild --format=cjs --outfile=dist/$(PKG_NAME).cjs.js $(FLAGS)
	$(EXEC) esbuild --format=esm --outfile=dist/$(PKG_NAME).esm.js $(FLAGS)
	-grep '^// ' dist/$(PKG_NAME).esm.js | grep node_modules

prepublish: build bundle
	$(EXEC) tsc --outDir lib/esm --emitDeclarationOnly --declaration

publish: clean prepublish
	npm publish --registry https://registry.npmjs.org
