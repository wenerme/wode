REPO_ROOT ?= $(shell git rev-parse --show-toplevel)
-include $(REPO_ROOT)/base.mk

#build:
#	-rm -rf ./lib/*
#	pnpm swc ./src -d ./lib
#	sed -E -i -r 's#(\bfrom\s+"\.[^"]+)";#\1.js";#g' ./lib/**/*.js

build:
	-rm -rf lib/*
	pnpm swc ./src -d ./lib --strip-leading-paths
	npx -y ts-add-js-extension --dir=lib

publish: build
	pnpm version patch --no-workspaces-update
	pnpm publish --registry https://registry.npmjs.org --access public --no-git-checks
