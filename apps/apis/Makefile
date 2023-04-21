REPO_ROOT ?= $(shell git rev-parse --show-toplevel)
-include $(REPO_ROOT)/node.mk

CI_COMMIT_BRANCH	?=$(shell git rev-parse --abbrev-ref HEAD)
CI_COMMIT_TAG		?=$(shell git describe --tags --exact-match 2>/dev/null)
CI_COMMIT_SHA		?=$(shell git rev-parse HEAD)
CI_COMMIT_SHORT_SHA	?=$(shell git rev-parse --short HEAD)

DIR_NAME := $(shell basename $(CURDIR))
APP_NAME ?= $(DIR_NAME)
IMAGE_NAME := registry.gitlab.com/wenerme/wode/$(APP_NAME)

build-standalone:
	@echo "Building standalone apps..."
	STANDALONE=true pnpm next build

# canvas.node: Exec format error
image-build:
	docker buildx build --load --build-arg APP_NAME=$(APP_NAME) --build-arg DIR_NAME=$(DIR_NAME) -t $(IMAGE_NAME) .
image-push:
	docker buildx build --push --build-arg APP_NAME=$(APP_NAME) --build-arg DIR_NAME=$(DIR_NAME) -t $(IMAGE_NAME):$(CI_COMMIT_BRANCH) .
image-run:
	docker run --rm -it -p 3000:3000 --name $(APP_NAME) $(IMAGE_NAME)
