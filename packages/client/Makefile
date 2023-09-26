REPO_ROOT ?= $(shell git rev-parse --show-toplevel)
-include $(REPO_ROOT)/base.mk

build:
	-rm -rf lib/*
	pnpm swc ./src -d ./lib
	pnpm dlx ts-add-js-extension --dir=lib

fmt:

publish: build
	pnpm publish --registry https://registry.npmjs.org --access public --no-git-checks
