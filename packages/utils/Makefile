
compile: bundle
	# esm
	npx tsc -m es2015 --outDir lib/esm
	# cjs
	npx tsc -m commonjs --outDir lib/cjs
	# esnext
	npx tsc -m esnext --outDir lib/esnext
	# dist
	# npx rollup -c rollup.config.ts

clean:
	rm -rf dist/* && rm -rf lib/*

bundle:
	npx esbuild src/index.ts --format=iife --outfile=dist/wener-utils.js --bundle --minify --sourcemap --target=chrome80 --define:process.env.NODE_ENV='\"production\"'
	npx esbuild src/index.ts --format=cjs --outfile=dist/wener-utils.cjs --bundle --minify --sourcemap --target=chrome80 --define:process.env.NODE_ENV='\"production\"'
	npx esbuild src/index.ts --format=esm --outfile=dist/wener-utils.esm.js --bundle --minify --sourcemap --target=chrome80 --define:process.env.NODE_ENV='\"production\"'
