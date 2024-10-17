REPO_ROOT ?= $(shell git rev-parse --show-toplevel)
# -include $(REPO_ROOT)/base.mk

# bash 4+
# globstar match all files
# extglob can exclude file
SHELL:=env bash -O extglob -O globstar

COLOR_INFO 	:= "\e[1;36m%s\e[0m\n"
COLOR_WARN 	:= "\e[1;31m%s\e[0m\n"

export NEXT_TELEMETRY_DISABLED	:=1
export NUXT_TELEMETRY_DISABLED	:=1
export DO_NOT_TRACK				:=1 # scarf, etc

# if $(REPO_ROOT)/.git exists
ifneq ($(wildcard $(REPO_ROOT)/.git),)
export CI_COMMIT_BRANCH		:=$(or $(CI_COMMIT_BRANCH), $(shell git rev-parse --abbrev-ref HEAD))
export CI_COMMIT_TAG		:=$(or $(CI_COMMIT_TAG), $(shell git describe --tags --exact-match 2>/dev/null))
export CI_COMMIT_SHA		:=$(or $(CI_COMMIT_SHA), $(shell git rev-parse HEAD))
export CI_COMMIT_SHORT_SHA	:=$(or $(CI_COMMIT_SHORT_SHA), $(shell git rev-parse --short HEAD))
export CI_COMMIT_TIMESTAMP	:=$(or $(CI_COMMIT_TIMESTAMP), $(shell git log -1 --format=%ct))
# for reproducible build
export SOURCE_DATE_EPOCH	:=$(or $(SOURCE_DATE_EPOCH), $(shell git log -1 --pretty=%ct))
endif

APP_NAME?=$(shell basename $(CURDIR))
IMAGE_TAG?=$(shell echo $(CI_COMMIT_BRANCH) | tr '/' '-')
IMAGE_COMMIT_TAG?=$(IMAGE_TAG)-$(CI_COMMIT_SHORT_SHA)
IMAGE_NAME?=$(APP_NAME):$(IMAGE_TAG)
# git@example.com:org/repo.git -> example.com/org/repo
# https://example.com/org/repo.git
IMAGE_REPO?=$(shell git remote get-url origin | sed -r -e 's-^https?://--' -e 's/^git@//' -e 's/.git$$//' -e 's-:-/-g' -e "s/$(APP_NAME)$$//" -e 's-//-/-g' -e 's-/$$--' )
IMAGE?=$(IMAGE_REPO)/$(APP_NAME):$(IMAGE_TAG)


PKG_ROOT ?= $(shell pnpm node -e 'process.stdout.write(path.resolve(__dirname))')

-include $(REPO_ROOT)/package.mk
-include $(REPO_ROOT)/local.mk

ifneq ($(PKG_ROOT),$(REPO_ROOT))
-include $(PKG_ROOT)/package.mk
-include $(PKG_ROOT)/local.mk
endif

info:
	@if ! command -v git &> /dev/null; then echo "Error: git is not installed." >&2 ; exit 1; fi
	@if ! command -v node &> /dev/null; then echo "Error: Node.js is not installed." >& 2; exit 1; fi
	@echo "APP_NAME:            $(APP_NAME)"
	@echo "CI_COMMIT_BRANCH:    $(CI_COMMIT_BRANCH)"
	@echo "CI_COMMIT_TAG:       $(CI_COMMIT_TAG)"
	@echo "CI_COMMIT_SHA:       $(CI_COMMIT_SHA)"
	@echo "CI_COMMIT_SHORT_SHA: $(CI_COMMIT_SHORT_SHA)"
	@echo "SOURCE_DATE_EPOCH:   $(SOURCE_DATE_EPOCH)"
	@echo "IMAGE_TAG:           $(IMAGE_TAG)"
	@echo "IMAGE_NAME:          $(IMAGE_NAME)"
	@echo "IMAGE_REPO:          $(IMAGE_REPO)"
	@echo "IMAGE:               $(IMAGE)"
	@! [ -e package.json ] || { \
	 echo "NodeJS:              $(shell node -v)"; \
	 echo "NPM:                 $(shell npm -v)"; \
	 echo "Package name:        $(shell jq -r '.name' package.json)"; \
	 echo "Package version:     $(shell jq -r '.version' package.json)"; \
	}
	@! [ -e $(REPO_ROOT)/pnpm-lock.yaml ] || { \
	 echo "PNPM:                $(shell pnpm -v)"; \
	}
	@realpath $(CURDIR) --relative-to $(REPO_ROOT)

.PHONY: info build dev test package-scripts-set fmt help

ifneq ($(wildcard package.json),)
package-scripts-set: ## install scripts in package.json
	yq '.scripts.build="make build" | .scripts.deploy="make deploy" | .scripts.test="make test"' -i package.json
fix-use-import-type: ## fix useImportType
	npx -y @biomejs/biome lint --only=style/useImportType ./src --write
fix-unused-imports: ## fix unused imports
	npx -y @biomejs/biome lint --only=lint/correctness/noUnusedImports ./src --write
fix-react-default-import:
	grit apply react_named_imports ./src
endif

FRAMEWORK ?= infer
ifeq ($(FRAMEWORK),infer)
ifneq ($(wildcard next.config.*),)
build: ## build project
	pnpm next build
dev: ## start dev server
	pnpm next dev --turbo
else ifneq ($(wildcard vite.config.*),)
build:
	pnpm vite build
dev:
	pnpm vite dev
endif
endif

fmt: ## format code
	pnpm prettier --cache --cache-strategy metadata --write ./src package.json $(wildcard *.ts postcss.config.* tailwind.config.* next.config.*)

help: ## show help message
	@grep -E -h '\s##\s' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

ifneq ($(wildcard docker-bake.hcl),)
DOCKER_BUILD_BAKE?=docker buildx bake

image: image-build

image-ls:
	@$(DOCKER_BUILD_BAKE) --print | jq -r '.target | .[] | .tags | .[]'
image-push:
	$(DOCKER_BUILD_BAKE) --push
image-push-%:
	$(DOCKER_BUILD_BAKE) --push $(*)
image-build:
	$(DOCKER_BUILD_BAKE) --load
image-build-%:
	$(DOCKER_BUILD_BAKE) --load $(*)

DOCKER_RUN_FLAGS?=--rm -it -p 8080:80 --name php
ifneq ($(wildcard .env.local),)
	DOCKER_RUN_FLAGS:=$(DOCKER_RUN_FLAGS) -v $(PWD)/.env.local:/app/.env.local
endif
image-run: image-build
	echo docker run --rm -it $(DOCKER_RUN_FLAGS) $(shell docker buildx bake --print | jq -r '.target | .[] | .tags | .[]' | head -n1)

endif
