
compile:
	# esm
	yarn tsc -m es2015 --outDir lib/esm
	# cjs
	yarn tsc -m commonjs --outDir lib/cjs
	# esnext
	yarn tsc -m esnext --outDir lib/esnext
	# dist
	yarn rollup -c rollup.config.ts

clean:
	rm -rf dist/* && rm -rf lib/*
