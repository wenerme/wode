clean:
	rm -rf src/**/*.{js,js.map} dist/* lib/* index.js

publish: clean build bundle
	npx tsc -m commonjs --outDir lib/cjs
	npx tsc -m esnext --outDir lib/esnext
	npm publish --registry https://registry.npmjs.org

build:
	rm -rf lib/esm/*
	npx tsc -m es2015 --outDir lib/esm --emitDeclarationOnly
	npx esbuild --format=esm --outdir=lib/esm --target=chrome80 src/index.ts src/**/*.{ts,tsx}

# --minify
FLAGS:=src/index.ts --external:{react,react-dom,prop-types} --define:process.env.NODE_ENV=\"production\" --target=chrome80 --sourcemap --bundle
bundle:
	rm -rf dist/*
	npx esbuild --format=iife --outfile=dist/wener-reaction.js $(FLAGS)
	npx esbuild --format=cjs --outfile=dist/wener-reaction.cjs $(FLAGS)
	npx esbuild --format=esm --outfile=dist/wener-reaction.mjs $(FLAGS)

# Check bundle
#-grep '^// ' dist/wener-reaction.esm.js | grep node_modules

fmt:
	npx prettier src -w

lint:
	tsc --pretty --noEmit
