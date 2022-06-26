REPO_ROOT ?= $(shell git rev-parse --show-toplevel)
# -include $(REPO_ROOT)/mod.mk

# globstar match all files
# extglob can exclude file
SHELL:=env bash -O extglob -O globstar

COLOR_INFO 	:= "\e[1;36m%s\e[0m\n"
COLOR_WARN 	:= "\e[1;31m%s\e[0m\n"

ifneq ("$(wildcard $(REPO_ROOT)/pnpm-lock.yaml)","")
EXEC=pnpm exec
PM=pnpm
else
EXEC=npx -y
PM=npm
endif

PKG_NAME?=$(shell jq -r '.name' package.json)
OUT_NAME?=$(shell jq -r '.name' package.json | tr -d '@' | tr '/' '-')
OSPM	:=$(shell for i in apk brew yum apt-get apt; do command -v $$i > /dev/null && break ; done; echo $$i)

info:
	@echo $(PKG_NAME)
	@echo -e "\t" $(shell jq -r '.name' package.json) v$(shell jq -r '.version' package.json)
	@echo -e "\t" $(PM) $(shell $(PM) -v)
	@echo -e "\t" OS : `uname -mispr`
	@echo -e "\t" OS Package Manager: $(OSPM)

clean:
	rm -rf dist/* lib/* .next/*

ifneq ($(wildcard next.config.js),)
# Next.JS
build:
	$(EXEC) next build
dev:
	$(EXEC) next dev
else
# Library
SOURCE_FILES?=$(shell ls src/**/*.ts src/**/*.tsx)
build:
	$(EXEC) esbuild --format=cjs --outdir=lib/cjs --target=chrome90 $(SOURCE_FILES)
	$(EXEC) esbuild --format=esm --outdir=lib --target=chrome90 $(SOURCE_FILES)
dev: build
	$(EXEC) esbuild --format=esm --outdir=lib --target=chrome90 --watch $(SOURCE_FILES)

ESBUILD_BUNDLE_FLAGS?= \
	--external:{react,react-dom,prop-types,classnames,@*,markdown-it,prosemirror*} \
	--define:process.env.NODE_ENV=\"production\" --charset=utf8 --target=chrome90 --sourcemap --bundle
bundle:
	$(EXEC) esbuild --format=cjs --outfile=dist/$(OUT_NAME).cjs.js $(ESBUILD_BUNDLE_FLAGS)
	$(EXEC) esbuild --format=esm --outfile=dist/$(OUT_NAME).esm.js $(ESBUILD_BUNDLE_FLAGS)
	-grep '^// ' dist/$(OUT_NAME).esm.js | grep node_modules

prepublish: build bundle
	$(EXEC) tsc --outDir lib/esm --emitDeclarationOnly --declaration

publish: clean prepublish
	$(PM) publish --registry https://registry.npmjs.org --access public

endif

fmt:
	$(EXEC) prettier src -w

lint:
	@printf $(COLOR_INFO) "Linting..."
ifneq ($(wildcard next.config.js),)
	$(EXEC) next lint
else ifneq ($(wildcard .eslintrc.js),)
	$(EXEC) eslint src
else ifneq ($(wildcard tsconfig.json),)
	$(EXEC) tsc --pretty --noEmit
else
	@printf $(COLOR_WARN) "No lint setup"
endif

test:
	@! [ -e jest.config.js ] || $(EXEC) jest

install:
	npm i -g $(PM)
	$(PM) install
