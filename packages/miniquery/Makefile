REPO_ROOT ?= $(shell git rev-parse --show-toplevel)
-include $(REPO_ROOT)/base.mk

build:
	$(NDEV) build lib

publish: build
	pnpm version patch --no-workspaces-update
	pnpm publish --registry https://registry.npmjs.org --access public --no-git-checks
