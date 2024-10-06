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

icons:
	#xmlstarlet ed -O --inplace -N x=http://www.w3.org/2000/svg --update "/x:svg/@fill" -v currentColor --insert "/x:svg[not(@fill)]" --type attr -n fill -v currentColor src/icons/svg/icons/*.svg
	pnpm dlx svgo -f src/icons/svg/icons -f src/icons/svg/brands --config ./svgo.config.mjs --pretty
	pnpm dlx @svgr/cli --typescript --out-dir src/icons/ --memo --no-prettier --no-index -- src/icons/svg/icons src/icons/svg/brands
	ls src/icons/*.tsx | xargs -n 1 basename -s .tsx | xargs -I {} echo "export { default as {} } from './{}'" > src/icons/index.ts
	$(EXEC) prettier --write src/icons/*.tsx
	git add src/icons

svgo:
	npx -y svgo -f public/assets/images/svg/brands --config svgo.config.json --pretty
	npx -y svgo -f public/assets/images/svg/tokens --config svgo.config.json --pretty
