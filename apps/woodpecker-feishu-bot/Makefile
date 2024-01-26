

clean:
	rm -rf ./dist/*

build: clean
	pnpm esbuild --external:{jsdom,pg-native} \
 		--format=esm --platform=node --charset=utf8 --target=chrome90 --sourcemap --legal-comments=external --bundle \
		--define:process.env.NODE_ENV=\"production\" --define:__DEV__=false \
		--minify-syntax \
		--banner:js="import { createRequire } from 'module';const require = createRequire(import.meta.url);" \
		--outfile=dist/main.mjs \
		src/main.ts

image: build
	PLATFORM=linux/amd64 docker buildx bake --load
push: build
	TAG=`jq '.version' package.json -r` docker buildx bake --push
image-run: image
	docker run --rm -it --env-file .env.local wener/woodpecker-feishu-bot

run:
	NODE_ENV=production pnpm tsx ./src/main.ts

