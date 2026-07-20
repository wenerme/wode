build:
	-rm -rf dist/* lib/*
	pnpm build
	pnpm swc ./src -d ./lib --strip-leading-paths
	npx -y ts-add-js-extension --dir=lib
