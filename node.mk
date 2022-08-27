REPO_ROOT ?= $(shell git rev-parse --show-toplevel)
# -include $(REPO_ROOT)/node.mk

# globstar match all files
# extglob can exclude file
SHELL:=env bash -O extglob -O globstar

COLOR_INFO 	:= "\e[1;36m%s\e[0m\n"
COLOR_WARN 	:= "\e[1;31m%s\e[0m\n"

ifneq ("$(wildcard $(REPO_ROOT)/pnpm-lock.yaml)","")
PM	:=pnpm
EXEC:=pnpm dlx
NPX :=pnpm dlx
else
PM	:=npm
EXEC:=npx
NPX :=npx -y
endif

PKG_NAME?=$(shell jq -r '.name' package.json)
OUT_NAME?=$(shell jq -r '.name' package.json | tr -d '@' | tr '/' '-')
OSPM	?=$(shell for i in apk brew yum apt-get apt; do command -v $$i > /dev/null && break ; done; echo $$i)

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
SOURCE_FILES?=$(shell ls src/**/*.js src/**/*.ts src/**/*.tsx | egrep -v '[.]test[.]tsx?')
build:
	@$(EXEC) esbuild --charset=utf8 --format=cjs --outdir=lib/cjs --target=chrome90 $(SOURCE_FILES)
	@$(EXEC) esbuild --charset=utf8 --format=esm --outdir=lib --target=chrome90 $(SOURCE_FILES)
dev: build
	@$(EXEC) esbuild --charset=utf8 --format=esm --outdir=lib --target=chrome90 --watch $(SOURCE_FILES)

ESBUILD_BUNDLE_FLAGS?= \
	--external:{react,react-dom,prop-types,classnames,@*,markdown-it,prosemirror*} \
	--define:process.env.NODE_ENV=\"production\" --charset=utf8 --target=chrome90 --sourcemap --bundle
bundle:
	@$(EXEC) esbuild --charset=utf8 --format=cjs --outfile=dist/$(OUT_NAME).cjs.js $(ESBUILD_BUNDLE_FLAGS)
	@$(EXEC) esbuild --charset=utf8 --format=esm --outfile=dist/$(OUT_NAME).esm.js $(ESBUILD_BUNDLE_FLAGS)
	-grep '^// ' dist/$(OUT_NAME).esm.js | grep node_modules

prepublish: build bundle
	$(EXEC) tsc --outDir lib/esm --emitDeclarationOnly --declaration

publish: clean prepublish
	$(PM) publish --registry https://registry.npmjs.org --access public

endif

fmt:
	$(EXEC) prettier src -w

fix: LINT_FIX=1
fix: lint

LINT_FIX=
lint:
	@printf $(COLOR_INFO) "Linting..."
ifneq ($(wildcard next.config.js),)
	$(EXEC) next lint $(if $(filter 1,$(LINT_FIX)),--fix)
else ifneq ($(wildcard .eslintrc.js $(REPO_ROOT)/.eslintrc.js),)
	$(EXEC) eslint src $(if $(filter 1,$(LINT_FIX)),--fix)
else ifneq ($(wildcard tsconfig.json),)
	$(EXEC) tsc --pretty --noEmit
else
	@printf $(COLOR_WARN) "No lint setup"
endif

test:
	@printf $(COLOR_INFO) "Testing..."
ifneq ($(wildcard jest.config.*),)
	$(EXEC) jest
else ifneq ($(wildcard ava.config.*),)
	$(EXEC) ava
else ifeq ($(shell jq 'has("ava")' package.json),true)
	$(EXEC) ava
else
	@printf $(COLOR_WARN) "No test setup"
endif

install:
	@printf $(COLOR_INFO) "Installing..."
	npm i -g $(PM)
	$(PM) install
