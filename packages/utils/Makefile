REPO_ROOT ?= $(shell git rev-parse --show-toplevel)
-include $(REPO_ROOT)/node.mk

check-syntax:
	! grep '[?][?]' lib/**/*.js
	! grep '[?][.]' lib/**/*.js


#build:
#	rm -rf lib/*
#	pnpm swc ./src -d ./lib
#	npx -y ts-add-js-extension --dir=lib
#	# lib/schema/typebox/gen/codegen/index.js
#	npx -y ts-add-js-extension --dir=lib # why ?

	#rm -rf lib2
	#pnpm swc ./src -d ./lib2
	#npx -y ts-add-js-extension --dir=lib2
	##rsync ./src/ ./lib2/ -a --include="*.css" --include="*/" --exclude="*"
	#-mv lib lib3
	#mv lib2 lib
	#rm -rf lib3

#bundle:
#	rm -rf dist/*

# pnpm publish --registry https://registry.npmjs.org --access public --no-git-checks
