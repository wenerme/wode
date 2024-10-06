REPO_ROOT ?= $(shell git rev-parse --show-toplevel)
-include $(REPO_ROOT)/base.mk

ifdef SERVER
APP_NAME:=$(SERVER)
IMAGE:=`cd builds && docker buildx bake --print $(SERVER) 2>/dev/null | jq -r '.target."$(SERVER)".tags[0]'`

# NODE_ENV=development pnpm tsx watch ./dist/out/apps/$(SERVER)/main.js
# detect main.bun.ts run by bun
ifneq ($(wildcard src/apps/$(SERVER)/main.bun.ts),)
dev:
	NODE_ENV=development bun --watch ./src/apps/$(SERVER)/main.bun.ts
else
dev:
	NODE_ENV=development pnpm node --loader ts-node/esm --watch ./src/apps/$(SERVER)/main.ts
endif

build: swc-build
	pnpm tsx src/scripts/bundle.esbuild.ts
	sha256sum dist/apps/$(SERVER)/main.mjs

# --enable-source-maps
# 20mb 启动 39s，不开启 启动 2s
run: build
	NODE_ENV=production pnpm node ./dist/apps/$(SERVER)/main.mjs

image-build-prepare:
	mkdir -p builds/$(SERVER)
	rsync -av dist/apps/$(SERVER)/ builds/$(SERVER)/app/
	! test -e public || rsync -av public/ builds/$(SERVER)/app/public/

image: image-build-prepare
	cd builds && docker buildx bake --load $(SERVER)
image-push: image-build-prepare
	cd builds && TAG=$(IMAGE_TAG) docker buildx bake --push $(SERVER)
image-tag:
	cd builds && TAG=$(IMAGE_TAG) docker buildx bake --print $(SERVER) 2>/dev/null | jq -r '.target."$(SERVER)".tags[0]'

deploy: build image-push

DOCKER_RUN_FLAGS?=--rm -it -p 3000:3000 --name $(SERVER)
ifneq ($(wildcard .env.local),)
	DOCKER_RUN_FLAGS:=$(DOCKER_RUN_FLAGS) --env-file .env.local
endif
image-run: image
	docker run $(DOCKER_RUN_FLAGS) --init $(IMAGE)
image-inspect: image
	docker run $(DOCKER_RUN_FLAGS) --entrypoint bash -w /app $(IMAGE)
doc:
	mkdir -p docs/reference/$(SERVER)
	mkdir -p docs/$(SERVER)/reference
	command -v widdershins || npm add -g widdershins
	curl -o docs/$(SERVER)/reference/openapi.json http://127.0.0.1:3000/api-json
	widdershins -u docs/widdershins/templates/openapi3 --omitHeader --summary --language_tabs='javascript:JavaScript' --language_tabs='http:HTTP' --language_tabs='shell:Shell' -o=docs/reference/includes/_$(SERVER).md -- docs/$(SERVER)/reference/openapi.json

else

list:
	@ls src/apps/* -d | xargs -n 1 basename

build:
	@echo Building all
	SERVER=`ls src/apps/* -d | xargs -n 1 basename | paste -sd,` pnpm tsx src/scripts/bundle.esbuild.ts

image-build-prepare:
	ls src/apps/* -d | xargs -n 1 basename | xargs -I {} make SERVER={} image-build-prepare

image-push: image-build-prepare
	cd builds && TAG=$(IMAGE_TAG) docker buildx bake --push

image-print:
	cd builds && TAG=$(IMAGE_TAG) docker buildx bake --print

deploy: image-push

dev: list
	false

dev\:%:
	@echo "Dev $*"
	@make SERVER=$(*) dev

run\:%:
	@echo "Running $*"
	@make SERVER=$(*) run

build\:%:
	@echo "Building $*"
	@make SERVER=$(*) build

image\:%:
	@echo "Building image $*"
	@make SERVER=$(*) image

deploy\:%:
	@echo "Deploy $*"
	@make SERVER=$(*) deploy


endif

swc-build:
	pnpm swc ./src -d ./dist/out

swc-watch:
	rm -rf ./dist/out/*
	pnpm swc --watch ./src -d ./dist/out


fix:
	pnpm eslint --fix ./src

doc-preview:
	docker run --rm --name slate -p 4567:4567 \
		-v `pwd`/dist/docs/build:/srv/slate/build \
		-v `pwd`/docs/reference/index.html.md:/srv/slate/source/index.html.md \
		-v `pwd`/docs/reference/includes:/srv/slate/source/includes \
		slatedocs/slate serve

chore: fmt fix
