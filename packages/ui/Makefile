REPO_ROOT ?= $(shell git rev-parse --show-toplevel)
-include $(REPO_ROOT)/base.mk

build:
	rm -rf lib2 lib3
	pnpm swc ./src -d ./lib2 --strip-leading-paths
	pnpm exec ts-add-js-extension --dir=lib2
	[ ! -e lib ] || mv lib lib3
	mv lib2 lib
	rm -rf lib3
