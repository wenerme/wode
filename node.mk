REPO_ROOT ?= $(shell git rev-parse --show-toplevel)
# -include $(REPO_ROOT)/node.mk

# globstar match all files
# extglob can exclude file
SHELL:=env bash -O extglob -O globstar

COLOR_INFO 	:= "\e[1;36m%s\e[0m\n"
COLOR_WARN 	:= "\e[1;31m%s\e[0m\n"

ifneq ("$(wildcard $(REPO_ROOT)/pnpm-lock.yaml)","")
PM	:=pnpm
EXEC:=pnpm exec
NPX :=pnpm dlx
else
PM	:=npm
EXEC:=npx
NPX :=npx -y
endif

PKG_NAME?=$(shell jq -r '.name' package.json)
OUT_NAME?=$(shell jq -r '.name' package.json | tr -d '@' | tr '/' '-')
OSPM	?=$(shell for i in apk brew yum apt-get apt; do command -v $$i > /dev/null && break ; done; echo $$i)

# for reproducible build
SOURCE_DATE_EPOCH?=$(shell git log -1 --pretty=%ct)

info:
	@echo $(PKG_NAME)
	@echo -e "\t" $(shell jq -r '.name' package.json) v$(shell jq -r '.version' package.json)
	@echo -e "\t" $(PM) $(shell $(PM) -v)
	@echo -e "\t" OS : `uname -mispr`
	@echo -e "\t" OS Package Manager: $(OSPM)

clean: distclean
	rm -rf .next/* .turbo/* node_modules/.cache/*
distclean:
	rm -rf dist/* lib/*

ifneq ($(wildcard next.config.js),)
# Next.JS
build:
	$(EXEC) next build
dev:
	$(EXEC) next dev
else
# Library
SOURCE_FILES?=$(shell ls 2>/dev/null src/**/*.js src/**/*.ts src/**/*.tsx | egrep -v '[.]test[.]tsx?')
ESBUILD_BUILD_FLAGS?= \
	--define:process.env.NODE_ENV=\"production\" --charset=utf8 --target=chrome90 --minify-syntax --sourcemap
build:
	@$(EXEC) esbuild --format=cjs --outdir=lib/cjs $(SOURCE_FILES) $(ESBUILD_BUILD_FLAGS)
	@$(EXEC) esbuild --format=esm --outdir=lib $(SOURCE_FILES) $(ESBUILD_BUILD_FLAGS)

libsum:
	@printf $(COLOR_INFO) "lib size"
	-@du --apparent-size -sh lib --exclude lib/cjs
	-@du --apparent-size -sh lib/cjs
	@printf $(COLOR_INFO) "lib checsum"
	-@tar --mtime="@0" --owner=0 --group=0 --numeric-owne --sort=name -cf - lib | sha1sum
	@printf $(COLOR_INFO) "dist size"
	-@du --apparent-size -sh dist/*.js
	@printf $(COLOR_INFO) "dist checsum"
	-@tar --mtime="@0" --owner=0 --group=0 --numeric-owne --sort=name -cf - dist | sha1sum
	@printf $(COLOR_INFO) "dist bundle node_modules?"
	-@grep '^// ' dist/$(OUT_NAME).esm.js | grep node_modules || echo none

ESBUILD_DEV_FLAGS?= \
	--define:process.env.NODE_ENV=\"development\" --charset=utf8 --target=chrome90 --sourcemap=external
dev: ESBUILD_BUILD_FLAGS=$(ESBUILD_DEV_FLAGS)
dev: build
	@$(EXEC) esbuild --format=esm --outdir=lib --watch $(SOURCE_FILES) $(ESBUILD_DEV_FLAGS)

ESBUILD_BUNDLE_FLAGS?= \
	--external:{react,react-dom,prop-types,classnames,@*,markdown-it,prosemirror*} \
	--define:process.env.NODE_ENV=\"production\" --charset=utf8 --target=chrome90 --sourcemap=external --legal-comments=external --bundle
bundle:
	@$(EXEC) esbuild --format=cjs --outfile=dist/$(OUT_NAME).cjs.js --minify-syntax $(ESBUILD_BUNDLE_FLAGS) src/index.ts
	@$(EXEC) esbuild --format=esm --outfile=dist/$(OUT_NAME).esm.js --minify-syntax $(ESBUILD_BUNDLE_FLAGS) src/index.ts
	@$(EXEC) esbuild --format=cjs --outfile=dist/$(OUT_NAME).cjs.min.js --minify $(ESBUILD_BUNDLE_FLAGS) src/index.ts
	@$(EXEC) esbuild --format=esm --outfile=dist/$(OUT_NAME).esm.min.js --minify $(ESBUILD_BUNDLE_FLAGS) src/index.ts


prepublish: build bundle libsum
#	$(EXEC) tsc --outDir lib/esm --emitDeclarationOnly --declaration

publish: distclean prepublish
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
