
compile: bundle
	# esm
	npx tsc -m es2015 --outDir lib/esm
	# cjs
	npx tsc -m commonjs --outDir lib/cjs
	# esnext
	npx tsc -m esnext --outDir lib/esnext

clean:
	rm -rf src/**/*.{js,d.ts,js.map} dist/* && rm -rf lib/*

publish: clean compile
	npm publish

bundle:
	npx esbuild src/index.ts --format=iife --outfile=dist/wener-reaction.js --bundle --minify --sourcemap --target=chrome80 --define:process.env.NODE_ENV='\"production\"' --external:react
	npx esbuild src/index.ts --format=cjs --outfile=dist/wener-reaction.cjs --bundle --minify --sourcemap --target=chrome80 --define:process.env.NODE_ENV='\"production\"' --external:react
	npx esbuild src/index.ts --format=esm --outfile=dist/wener-reaction.esm.js --bundle --minify --sourcemap --target=chrome80 --define:process.env.NODE_ENV='\"production\"' --external:react
