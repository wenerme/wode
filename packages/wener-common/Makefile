REPO_ROOT ?= $(shell git rev-parse --show-toplevel)
-include $(REPO_ROOT)/base.mk


build:
	rm -rf lib2
	pnpm swc ./src -d ./lib2 --strip-leading-paths
	npx -y ts-add-js-extension --dir=lib2
	rsync ./src/ ./lib2/ -a --include="*.css" --include="*.json" --include="*/" --exclude="*"
	-mv lib lib3
	mv lib2 lib
	rm -rf lib3

publish: build
	pnpm version patch --no-workspaces-update
	pnpm publish --registry https://registry.npmjs.org --access public --no-git-checks
