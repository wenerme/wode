
compile: bundle
	# esm
	npx tsc -m es2015 --outDir lib/esm
	# cjs
	npx tsc -m commonjs --outDir lib/cjs
	# esnext
	npx tsc -m esnext --outDir lib/esnext
	# npx esbuild index.ts --outdir=.

clean:
	rm -rf src/**/*.{js,js.map} dist/* lib/* index.js

publish: clean compile
	npm publish --registry https://registry.npmjs.org

build:
	rm -rf lib/esm/*
	npx tsc -m es2015 --outDir lib/esm --emitDeclarationOnly
	npx esbuild --format=esm --outdir=lib/esm --target=chrome80 src/index.ts src/**/*.{ts,tsx}

# --minify
FLAGS:=src/index.ts --external:{react,react-dom,prop-types} --define:process.env.NODE_ENV=\"production\" --target=chrome80 --sourcemap --bundle
bundle:
	npx esbuild --format=iife --outfile=dist/wener-reaction.js $(FLAGS)
	npx esbuild --format=cjs --outfile=dist/wener-reaction.cjs $(FLAGS)
	npx esbuild --format=esm --outfile=dist/wener-reaction.esm.js $(FLAGS)
# Check bundle
#-grep '^// ' dist/wener-reaction.esm.js | grep node_modules

fmt:
	npx prettier src -w
