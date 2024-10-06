FRAMEWORK_INFER:=none

REPO_ROOT ?= $(shell git rev-parse --show-toplevel)
-include $(REPO_ROOT)/base.mk

export BUILD_DATE=$(shell date -u +"%Y-%m-%dT%H:%M:%SZ")

-include .env

image-push: export VERSION=$(IMAGE_TAG)
image-ls: export VERSION=$(IMAGE_TAG)

deploy: image-push

# 提前 build-web
build: build-web web-image

build-libs:
	NODE_ENV=production TW_PX=1 pnpm tsx ./src/libs/bundle.ts

#npx tailwindcss -i ./src/app/styles/global.css -o ./dist/global.css --minify
#ls -lash dist/global.css
#pnpm tsx rem2px.ts
#	pnpm esbuild --external:{node:*,stream,crypto,path,fs,next,undici,nats.ws,nats,@mikro-orm/*,@nestjs/*} --platform=browser --charset=utf8 --legal-comments=external --bundle --define:process.env.NODE_ENV=\"production\" --define:__DEV__=false --minify --outfile=dist/qiyehuo.admin.js ./src/libs/qiyehuo.admin/index.tsx
#pnpm esbuild --external:{node:*,stream,crypto,path,fs,next,undici,nats.ws,nats,@mikro-orm/*,@nestjs/*} --platform=browser --charset=utf8 --legal-comments=external --bundle --define:process.env.NODE_ENV=\"production\" --define:__DEV__=false --minify-syntax --outfile=dist/qiyehuo.admin.js ./src/libs/qiyehuo.admin/index.tsx
#pnpm esbuild --external:{node:*,stream,crypto,path,next,@vercel/og,fs,undici,nats.ws,nats,@mikro-orm/*,@nestjs/*} --platform=browser --charset=utf8 --legal-comments=external --bundle --define:process.env.NODE_ENV=\"production\" --define:__DEV__=false --minify-syntax --outfile=dist/qiyehuo.admin.js ./src/libs/qiyehuo.admin/index.tsx

dbg-libs:
	NODE_ENV=development TW_PX=1 pnpm tsx ./src/libs/bundle.ts

# production

favicon:
	cd public \
	&& rsvg-convert -h 128 -w 128 --keep-aspect-ratio --background-color=none logo.svg > favicon.png \
	&& cp favicon.png in.png \
    && convert in.png -gravity center -background transparent -extent 128x128 favicon.png \
    && oxipng -o max -i 0 --strip safe *.png \
    && mv favicon.png favicon.ico

opt-images:
	oxipng -o max -i 0 --strip safe src/images/*.png

dev: dev-web-vite

dev-web-next:
	PORT=$(PORT) NODE_ENV=development pnpm next dev --turbo

dev-web-vite:
	NODE_ENV=development pnpm vite --port $(PORT) --host

dev-server:
	NODE_ENV=development pnpm node --loader ts-node/esm --watch ./src/server/main.ts

build-web: write-version build-web-vite

build-web-vite:
	NODE_ENV=production pnpm vite build

build-server:
	NODE_ENV=production pnpm swc ./src -d ./lib/out --strip-leading-paths
	SERVER=server:./lib/out/server/main.js:./lib/app/main.mjs pnpm tsx src/server/bundle.esbuild.ts

server-image:
	mkdir -p builds/web-api-server/app
	rsync -av lib/app/ builds/web-api-server/app/ --delete
	rsync -av public/ builds/web-api-server/app/public/

clean-image:
	rm -rf builds/*/app/* dist/* lib/*

write-version:
	pnpm tsx ./src/scripts/write-version.ts

web-image: web-image-static

web-image-static:
	rsync -av dist/ builds/web-static/app/ --delete --mkpath

# $(git diff --name-only --diff-filter d | grep '\.tsx?$' | xargs)
gql-gen:
	pnpm graphql-codegen --config codegen.ts
	pnpm prettier --write src/gql

gql-gen-dl: export DOWNLOAD_SCHEMA=1
gql-gen-dl: gql-gen
