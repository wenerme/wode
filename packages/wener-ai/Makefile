build:
	-rm -rf lib/*
	pnpm swc ./src -d ./lib --strip-leading-paths
	npx -y ts-add-js-extension --dir=lib

publish:
	pnpm publish --registry https://registry.npmjs.org --access public --no-git-checks
