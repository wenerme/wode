REPO_ROOT ?= $(shell git rev-parse --show-toplevel)
include $(REPO_ROOT)/node.mk

publish: fmt build
	pnpm publish --access public --registry https://registry.npmjs.org --tag latest

cover:
	pnpm exec c8 ava
