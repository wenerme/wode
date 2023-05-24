REPO_ROOT ?= $(shell git rev-parse --show-toplevel)
# -include $(REPO_ROOT)/base.mk

# globstar match all files
# extglob can exclude file
SHELL:=env bash -O extglob -O globstar

COLOR_INFO 	:= "\e[1;36m%s\e[0m\n"
COLOR_WARN 	:= "\e[1;31m%s\e[0m\n"

# for reproducible build
export SOURCE_DATE_EPOCH=$(shell git log -1 --pretty=%ct)

#
CI_COMMIT_BRANCH	?=$(shell git rev-parse --abbrev-ref HEAD)
CI_COMMIT_TAG		?=$(shell git describe --tags --exact-match 2>/dev/null || true)
CI_COMMIT_SHA		?=$(shell git rev-parse HEAD)
CI_COMMIT_SHORT_SHA	?=$(shell git rev-parse --short HEAD)
IMAGE_TAG			?=$(shell echo $(CI_COMMIT_BRANCH) | tr '/' '-')

-include $(REPO_ROOT)/local.mk

ifneq ($(DOCKER_REGISTRY),"")
export IMAGE_REGISTRY=$(DOCKER_REGISTRY)
endif
