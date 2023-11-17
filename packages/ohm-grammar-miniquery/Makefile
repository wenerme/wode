REPO_ROOT ?= $(shell git rev-parse --show-toplevel)
include $(REPO_ROOT)/node.mk

publish: fmt build
	pnpm publish --access public --registry https://registry.npmjs.org --tag latest --no-git-checks

cover:
	#pnpm exec c8 ava

gen:
	pnpm ohm generateBundles --withTypes --esm src/grammar/miniquery.ohm
