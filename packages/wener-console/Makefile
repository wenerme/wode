REPO_ROOT ?= $(shell git rev-parse --show-toplevel)
-include $(REPO_ROOT)/base.mk

#build:
#	-rm -rf ./lib/*
#	pnpm swc ./src -d ./lib
#	sed -E -i -r 's#(\bfrom\s+"\.[^"]+)";#\1.js";#g' ./lib/**/*.js

build:
	rm -rf lib2
	pnpm swc ./src -d ./lib2 --strip-leading-paths --copy-files
	npx -y ts-add-js-extension --dir=lib2
	#rsync ./src/ ./lib2/ -a --include="*.css" --include="*/" --exclude="*"
	-mv lib lib3
	mv lib2 lib
	rm -rf lib3

publish: build
	pnpm version patch --no-workspaces-update
	pnpm publish --registry https://registry.npmjs.org --access public --no-git-checks

publint:
	npx -y publint

sync-css:
	rsync ./src/ ./lib/ -avz --include="*.css" --include="*/" --exclude="*"

publish-next: build
	pnpm version prerelease --preid=beta --no-workspaces-update
	pnpm publish --registry https://registry.npmjs.org --access public --no-git-checks --tag next

icons:
	#xmlstarlet ed -O --inplace -N x=http://www.w3.org/2000/svg --update "/x:svg/@fill" -v currentColor --insert "/x:svg[not(@fill)]" --type attr -n fill -v currentColor src/icons/svg/icons/*.svg
	pnpm dlx svgo -f src/icons/svg/icons -f src/icons/svg/brands --config ./svgo.config.mjs --pretty
	pnpm dlx @svgr/cli --typescript --out-dir src/icons/ --memo --no-prettier --no-index -- src/icons/svg/icons src/icons/svg/brands
	ls src/icons/*.tsx | xargs -n 1 basename -s .tsx | xargs -I {} echo "export { default as {} } from './{}'" > src/icons/index.ts
	$(EXEC) prettier --write src/icons/*.tsx
	git add src/icons
