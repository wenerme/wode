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
PKG_VER ?=$(shell jq -r '.version' package.json)
OUT_NAME?=$(shell jq -r '.name' package.json | tr -d '@' | tr '/' '-')
OSPM	?=$(shell for i in apk brew yum apt-get apt; do command -v $$i > /dev/null && break ; done; echo $$i)

# for reproducible build
SOURCE_DATE_EPOCH?=$(shell git log -1 --pretty=%ct)

info:
	@printf $(COLOR_INFO) $(PKG_NAME):
	@echo "  version:" v$(PKG_VER)
	@echo "  npm    :" $(PM) $(shell $(PM) -v)
	@echo "  OS     :" `uname -mispr`
	@echo "  OSPM   :" $(OSPM)
	@printf $(COLOR_INFO) "  bundle:"
	@echo "    Name :" $(OUT_NAME)
	@echo "    CJS  :" $(WANT_CJS)

clean: distclean ## clean up built files and caches
	rm -rf .next/* .turbo/* node_modules/.cache/*
distclean: ## clean up built files
	rm -rf dist/* lib/*

ifneq ($(wildcard next.config.*),)
# Next.JS
build:
	$(EXEC) next build
dev:
	$(EXEC) next dev
else ifneq ($(wildcard vite.config.*),)
# Vite
build:
	$(EXEC) vite build
dev:
	$(EXEC) vite dev
else
# Library
WANT_CJS?=$(shell jq -r '.exports["."]|has("require")' package.json)

ESBUILD_DEVELOPMENT_FLAGS?	=--define:process.env.NODE_ENV=\"development\" --define:__DEV__=true --minify-syntax --charset=utf8 --target=chrome90 --sourcemap
ESBUILD_PRODUCTION_FLAGS?	=--define:process.env.NODE_ENV=\"production\" --define:__DEV__=false --minify --charset=utf8 --target=chrome90 --sourcemap

SOURCE_FILES?=$(shell ls 2>/dev/null src/**/*.js src/**/*.ts src/**/*.tsx | egrep -v '[.]test[.]tsx?')
# will not minify
ESBUILD_BUILD_FLAGS?=--charset=utf8 --target=chrome90 --sourcemap --platform=neutral
build:
ifneq ($(wildcard rollup.config.*),)
	$(MAKE) rollup
else ifneq ($(wildcard esbuild.build.*),)
	$(EXEC) $(wildcard esbuild.build.*)
else
	@$(EXEC) esbuild --format=esm --outdir=lib/esm --out-extension:.js=.mjs $(SOURCE_FILES) $(ESBUILD_BUILD_FLAGS)
ifeq ($(WANT_CJS),true)
	@$(EXEC) esbuild --format=cjs --outdir=lib/cjs $(SOURCE_FILES) $(ESBUILD_BUILD_FLAGS)
endif
endif

build-declaration:
	$(EXEC) tsc --outDir lib/esm --emitDeclarationOnly --declaration

libsum:
	@printf $(COLOR_INFO) "lib size"
	-@du --apparent-size -sh lib/esm
	-@du --apparent-size -sh lib/cjs
	@printf $(COLOR_INFO) "dist size"
	-@du --apparent-size -sh dist/**/*.js
	@printf $(COLOR_INFO) "dist bundle node_modules?"
	-@grep '^// ' dist/esm/index.development.js | grep node_modules || echo none
	@printf $(COLOR_INFO) "checksum"
	-@tar --mtime="@0" --owner=0 --group=0 --numeric-owne --sort=name -cf - lib | sha256sum | sed 's/-/lib/'
	-@tar --mtime="@0" --owner=0 --group=0 --numeric-owne --sort=name -cf - dist | sha256sum | sed 's/-/dist/'

ESBUILD_DEV_FLAGS?= \
	--define:process.env.NODE_ENV=\"development\" --define:__DEV__=true --charset=utf8 --target=chrome90 --sourcemap=external
dev: ESBUILD_BUILD_FLAGS=$(ESBUILD_DEV_FLAGS)
dev: build
	@$(EXEC) esbuild --format=esm --outdir=lib --watch $(SOURCE_FILES) $(ESBUILD_DEV_FLAGS)

ESBUILD_BUNDLE_FLAGS?= \
	--external:{react,react-dom,prop-types,classnames,@*,markdown-it,prosemirror*} \
	--charset=utf8 --target=chrome90 --sourcemap=external --legal-comments=external --bundle
bundle:
ifneq ($(wildcard rollup.config.*),)
	@printf $(COLOR_INFO) "rollup bundled in build phase"
else ifneq ($(wildcard esbuild.bundle.*),)
	$(EXEC) $(wildcard esbuild.bundle.*)
else
	@$(EXEC) esbuild --format=esm --outfile=dist/esm/$(OUT_NAME).development.js $(ESBUILD_DEVELOPMENT_FLAGS) $(ESBUILD_BUNDLE_FLAGS) src/index.ts
	@$(EXEC) esbuild --format=esm --outfile=dist/esm/$(OUT_NAME).min.js $(ESBUILD_PRODUCTION_FLAGS) $(ESBUILD_BUNDLE_FLAGS) src/index.ts
endif

ifneq ($(wildcard rollup.config.js),)
rollup:
	$(EXEC) rollup -c
else ifneq ($(wildcard rollup.config.ts),)
rollup:
	$(EXEC) rollup -c --configPlugin @rollup/plugin-typescript
endif

prepublish: distclean build bundle libsum

publish: prepublish
	$(PM) publish --registry https://registry.npmjs.org --access public

sync-mirror:
	curl -sf -X PUT "https://registry-direct.npmmirror.com/$(PKG_NAME)/sync?sync_upstream=true" | jq

endif

fmt:
	$(EXEC) prettier src -w

fix: LINT_FIX=1
fix: lint

LINT_FIX=
lint:
	@printf $(COLOR_INFO) "Linting..."
ifneq ($(wildcard next.config.*),)
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
