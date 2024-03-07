REPO_ROOT ?= $(shell git rev-parse --show-toplevel)
-include $(REPO_ROOT)/base.mk

bundle-system:
	$(EXEC) rollup -i src/index.ts -f system -p typescript -o dist/$(OUT_NAME).system.js

check-syntax:
	! grep '[?][?]' lib/**/*.js
	! grep '[?][.]' lib/**/*.js


build:
	rm -rf lib2
	pnpm swc ./src -d ./lib2 --strip-leading-paths
	npx -y ts-add-js-extension --dir=lib2
	rsync ./src/ ./lib2/ -a --include="*.css" --include="*/" --exclude="*"
	-mv lib lib3
	mv lib2 lib
	rm -rf lib3

publish:
	pnpm version patch --no-workspaces-update
	pnpm publish --registry https://registry.npmjs.org --access public --no-git-checks
