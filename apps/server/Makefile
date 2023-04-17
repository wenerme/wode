
CI_COMMIT_BRANCH	?=$(shell git rev-parse --abbrev-ref HEAD)
CI_COMMIT_TAG		?=$(shell git describe --tags --exact-match 2>/dev/null || true)
CI_COMMIT_SHA		?=$(shell git rev-parse HEAD)
CI_COMMIT_SHORT_SHA	?=$(shell git rev-parse --short HEAD)

APP_NAME?=$(SERVER)

IMAGE_TAG?=$(shell echo $(CI_COMMIT_BRANCH) | tr '/' '-')
IMAGE_TAG_COMMIT?=$(IMAGE_TAG)-$(CI_COMMIT_SHORT_SHA)
IMAGE_NAME?=$(APP_NAME):$(IMAGE_TAG)
#IMAGE?=$(IMAGE_REPO)/$(APP_NAME):$(IMAGE_TAG)

# IMAGE_REPO?=

IMAGE=`cd builds && docker buildx bake --print $(SERVER) 2>/dev/null | jq -r '.target."$(SERVER)".tags[0]'`

ifdef SERVER
dev:
	NODE_ENV=development pnpm tsx watch ./dist/out/apps/$(SERVER)/main.js
build:
	pnpm esbuild \
		--external:{jsdom,pg-native,pg-query-stream} \
		--external:{@mikro-orm/entity-generator,@mikro-orm/migrations,@mikro-orm/seeder} \
		--external:{@mikro-orm/mongodb,@mikro-orm/mysql,@mikro-orm/sqlite,@mikro-orm/better-sqlite,@mikro-orm/mariadb} \
		--external:{sqlite3,better-sqlite3,mysql2,mysql,oracledb,tedious} \
		--external:{class-transformer,cache-manager,@fastify/view,@nestjs/platform-express,@nestjs/microservices,@nestjs/websockets} \
		--format=esm --platform=node --charset=utf8 --target=chrome90 --sourcemap --legal-comments=external --bundle \
		--keep-names --minify-syntax \
		--define:process.env.NODE_ENV=\"production\" --define:__DEV__=false \
		--banner:js="import { createRequire } from 'module';const require = createRequire(import.meta.url);var __filename;var __dirname;{const {fileURLToPath} = await import('url');const {dirname} = await import('path');var __filename = fileURLToPath(import.meta.url); __dirname = dirname(__filename)};" \
		--outfile=dist/apps/$(SERVER)/main.mjs \
		./dist/out/apps/$(SERVER)/main.js
	sha256sum dist/apps/$(SERVER)/main.mjs
	rsync -av dist/apps/$(SERVER)/ builds/$(SERVER)/app/
	rsync -av public/ builds/$(SERVER)/app/public/

run: build
	NODE_ENV=production pnpm node --enable-source-maps ./dist/apps/$(SERVER)/main.mjs

image:
	cd builds && docker buildx bake --load $(SERVER)
image-push: build
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

else

build:
	echo Building all

endif

fmt:
	pnpm prettier --write ./src package.json
fix:
	pnpm eslint --fix ./src

swc-build:
	pnpm swc ./src -d ./dist/out
swc-watch:
	rm -rf ./dist/out/*
	pnpm swc --watch ./src -d ./dist/out
