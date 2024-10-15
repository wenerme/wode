FRAMEWORK_INFER:=none
REPO_ROOT ?= $(shell git rev-parse --show-toplevel)
-include $(REPO_ROOT)/base.mk

build:
	pnpm next build --experimental-build-mode compile --experimental-app-only
dev:
	pnpm next dev --turbo

ifneq (,$(wildcard docker-bake.hcl))
image-load: build
	docker buildx bake --load
image-push: build
	docker buildx bake --push
image-ls:
	docker buildx bake --print
endif

deploy:
	$(MAKE) image-push

optimize:
	oxipng -o max -i 0 --strip safe src/assets/img/*.png

optimize2:
	oxipng -o max -i 0 --strip safe public/assets/images/product/*.png

favicon:
	convert public/logo.svg -resize 128x128 -gravity center -background transparent -extent 128x128 src/app/favicon.ico

icon:
	rsvg-convert -h 256 -w 256 --keep-aspect-ratio --background-color=none public/logo.svg > src/app/icon.png
	magick convert src/app/icon.png src/app/favicon.ico
	oxipng -o max -i 0 --strip safe src/app/icon.png

gql-gen:
	pnpm graphql-codegen --config codegen.ts
	pnpm prettier --write src/gql

gql-gen-dl: export DOWNLOAD_SCHEMA=1
gql-gen-dl: gql-gen

rev:
	curl -X POST 'http://127.0.0.1:3000/actions/revalidate?path=/&type=layout'

i18n-extract:
	pnpm lingui extract
i18n-compile:
	pnpm lingui compile --namespace es
