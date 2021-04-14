ESBUILD:=npx esbuild --bundle --sourcemap --target=chrome80 --define:process.env.NODE_ENV=production --external:react

bundle:
	$(ESBUILD) src/apps/calc/index.ts --outfile=dist/apps/calc.js

