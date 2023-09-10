REPO_ROOT ?= $(shell git rev-parse --show-toplevel)
-include $(REPO_ROOT)/base.mk

#build:
#	-rm -rf ./lib/*
#	pnpm swc ./src -d ./lib
#	sed -E -i -r 's#(\bfrom\s+"\.[^"]+)";#\1.js";#g' ./lib/**/*.js

build:
	-rm -rf lib/*
	# pnpm tsc --noEmit false --outdir lib --declaration --declarationDir lib
	pnpm tsc --noEmit false --outdir lib

publish: build
	pnpm publish --registry https://registry.npmjs.org --access public --no-git-checks
