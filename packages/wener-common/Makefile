REPO_ROOT ?= $(shell git rev-parse --show-toplevel)
-include $(REPO_ROOT)/base.mk


build:
	pnpm swc ./src -d ./lib --strip-leading-paths
	npx -y ts-add-js-extension --dir=lib
	rsync ./src/ ./lib/ -a --include="*.css" --include="*.json" --include="*/" --exclude="*"

publish: build
	pnpm publish --registry https://registry.npmjs.org --access public --no-git-checks
