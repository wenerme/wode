
compile:
	# esm
	yarn tsc -m es2015 --outDir lib/esm
	# cjs
	yarn tsc -m commonjs --outDir lib/cjs
	# esnext
	yarn tsc -m esnext --outDir lib/esnext

clean:
	rm -rf src/**/*.{js,d.ts,js.map} dist/* && rm -rf lib/*

publish: clean compile
	npm publish
