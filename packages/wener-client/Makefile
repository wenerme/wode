REPO_ROOT ?= $(shell git rev-parse --show-toplevel)
-include $(REPO_ROOT)/base.mk

build:
	-rm -rf lib/*
	pnpm swc ./src -d ./lib --strip-leading-paths
	npx -y ts-add-js-extension --dir=lib
	# add json
	rsync -av --no-times --no-owner --include='*/' --include='*.json' --exclude='*' src/ lib/

fmt:

publish: build
	pnpm version patch --no-workspaces-update
	pnpm publish --registry https://registry.npmjs.org --access public --no-git-checks

pkg-fmt:


run-bun:
	docker run --platform linux/amd64 -it --rm -v `git rev-parse --show-toplevel`:/host -w /host/`realpath --relative-to $(shell git rev-parse --show-toplevel) ${PWD}` -p 3000:3000 --name bun --entrypoint bash oven/bun:debian
