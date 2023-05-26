REPO_ROOT ?= $(shell git rev-parse --show-toplevel)
-include $(REPO_ROOT)/base.mk


APP_NAME?=$(SERVER)

IMAGE_TAG_COMMIT?=$(IMAGE_TAG)-$(CI_COMMIT_SHORT_SHA)
IMAGE_NAME?=$(APP_NAME):$(IMAGE_TAG)
#IMAGE?=$(IMAGE_REPO)/$(APP_NAME):$(IMAGE_TAG)

# IMAGE_REPO?=

IMAGE=`cd builds && docker buildx bake --print $(SERVER) 2>/dev/null | jq -r '.target."$(SERVER)".tags[0]'`

ifdef SERVER
dev:
	NODE_ENV=development pnpm tsx watch ./dist/out/apps/$(SERVER)/main.js
build: swc-build
	pnpm tsx src/app/scripts/bundle.esbuild.ts
	sha256sum dist/apps/$(SERVER)/main.mjs

run: build
	NODE_ENV=production pnpm node --enable-source-maps ./dist/apps/$(SERVER)/main.mjs

image-build-prepare:
	mkdir -p builds/$(SERVER)
	rsync -av dist/apps/$(SERVER)/ builds/$(SERVER)/app/
	rsync -av public/ builds/$(SERVER)/app/public/

image: image-build-prepare
	cd builds && docker buildx bake --load $(SERVER)
image-push: image-build-prepare
	cd builds && TAG=$(IMAGE_TAG) docker buildx bake --push $(SERVER)
image-tag:
	cd builds && TAG=$(IMAGE_TAG) docker buildx bake --print $(SERVER) 2>/dev/null | jq -r '.target."$(SERVER)".tags[0]'

image-run: image
	docker run --rm -it \
		-p 3000:3000 \
		--init \
		--name $(SERVER) $(IMAGE)

image-inspect: image
	docker run --rm -it \
		-p 3000:3000 \
		--entrypoint bash \
		-w /app \
		--name $(SERVER) $(IMAGE)
doc:
	mkdir -p docs/reference/$(SERVER)
	mkdir -p docs/$(SERVER)/reference
	command -v widdershins || npm add -g widdershins
	curl -o docs/$(SERVER)/reference/openapi.json http://127.0.0.1:3000/api-json
	widdershins -u docs/widdershins/templates/openapi3 --omitHeader --summary --language_tabs='javascript:JavaScript' --language_tabs='http:HTTP' --language_tabs='shell:Shell' -o=docs/reference/includes/_$(SERVER).md -- docs/$(SERVER)/reference/openapi.json

else

list:
	ls src/apps/* -d | xargs -n 1 basename

build: swc-build
	echo Building all
	SERVER=`ls src/apps/* -d | xargs -n 1 basename | paste -sd,` pnpm tsx src/app/scripts/bundle.esbuild.ts

image-build-prepare:
	ls src/apps/* -d | xargs -n 1 basename | xargs -I {} make SERVER={} image-build-prepare

image-push: image-build-prepare
	cd builds && TAG=$(IMAGE_TAG) docker buildx bake --push

deploy: image-push

dev: swc-watch

endif

swc-build:
	pnpm swc ./src -d ./dist/out

swc-watch:
	rm -rf ./dist/out/*
	pnpm swc --watch ./src -d ./dist/out

fmt:
	pnpm prettier --write ./src package.json
fix:
	pnpm eslint --fix ./src

doc-preview:
	docker run --rm --name slate -p 4567:4567 \
		-v `pwd`/dist/docs/build:/srv/slate/build \
		-v `pwd`/docs/reference/index.html.md:/srv/slate/source/index.html.md \
		-v `pwd`/docs/reference/includes:/srv/slate/source/includes \
		slatedocs/slate serve

chore: fmt fix
