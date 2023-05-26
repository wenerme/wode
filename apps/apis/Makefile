REPO_ROOT ?= $(shell git rev-parse --show-toplevel)
-include $(REPO_ROOT)/base.mk

DIR_NAME := $(shell basename $(CURDIR))
APP_NAME ?= $(DIR_NAME)
IMAGE_NAME ?= $(IMAGE_REGISTRY)/wenerme/wode/$(APP_NAME)

build:
	pnpm next build

# canvas.node: Exec format error
image-build:
	docker buildx build --load --build-arg APP_NAME=$(APP_NAME) --build-arg DIR_NAME=$(DIR_NAME) -t $(IMAGE_NAME) .
image-tag:
	@echo $(IMAGE_NAME):$(IMAGE_TAG)
image-push: image-tag
	docker buildx build --push --build-arg APP_NAME=$(APP_NAME) --build-arg DIR_NAME=$(DIR_NAME) -t $(IMAGE_NAME):$(IMAGE_TAG) .
image-run:
	docker run --rm -it -p 3000:3000 --name $(APP_NAME) $(IMAGE_NAME)

deploy: image-push
