SHELL:=env bash -O extglob -O globstar

optimize-svg:
	xmlstarlet ed -O --inplace -N x=http://www.w3.org/2000/svg --update "/x:svg/@fill" -v currentColor --insert "/x:svg[not(@fill)]" --type attr -n fill -v currentColor ./svg/icons/*.svg
	pnpm dlx svgo svg/**/*.svg --pretty

svgr:
	npx -y @svgr/cli --typescript --out-dir . --memo --no-prettier --no-index -- $(PWD)/svg/icons $(PWD)/svg/brands $(PWD)/svg/color
	ls *.tsx | xargs -n 1 basename -s .tsx | xargs -I {} echo "export { default as {} } from './{}'" > index.ts
	pnpm prettier --write $(PWD)
	git add .

svgo:
	pnpm dlx svgo svg/**/*.svg --pretty

pretty:

