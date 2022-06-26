REPO_ROOT ?= $(shell git rev-parse --show-toplevel)
-include $(REPO_ROOT)/node.mk

gen:
	npx graphql-codegen --config codegen.yml

gen-contracts:
	npx ts-node -r tsconfig-paths/register ./src/scripts/gen-contracts.ts

gen-typechain: gen-contracts
	rm -rf src/generated/contracts
	npx typechain --target=ethers-v5 --discriminate-types --out-dir src/generated/contracts contracts/abi/**/*.json
	git add contracts src/generated/contracts

icons:
	npx -y svgo -f src/icons/svg --config svgo.config.json --pretty
	npx -y @svgr/cli --typescript --out-dir src/icons/ -- src/icons/svg
	git add src/icons

svgo:
	npx -y svgo -f public/assets/images/svg/brands --config svgo.config.json --pretty
	npx -y svgo -f public/assets/images/svg/tokens --config svgo.config.json --pretty

favicon:
	npx -y svgo public/assets/images/svg/logo.svg --config svgo.config.json --pretty
	rsvg-convert -h 128 public/assets/images/svg/logo.svg > public/favicon.png
	convert -resize 16x16 public/favicon.png public/favicon.ico

vercel-install: info
	command -v jq > /dev/null || yum install jq -y
	npm install -g $(PM)
	$(PM) install --prefix ../..

ci:
	echo $(date --rfc-3339=seconds) NPM Installing
	npm ci --prefer-offline --no-audit --force
	echo $(date --rfc-3339=seconds) NPM Building
	UPLOAD_BASE=http://mengji-cms NODE_ENV=production npm run build
	echo $(date --rfc-3339=seconds) NPM Built

image: build
	echo $(date --rfc-3339=seconds) Docker building
	docker build -f Dockerfile -t $(shell basename $(PWD)) .
	echo $(date --rfc-3339=seconds) Docker buillt $(shell basename $(PWD))

image-verify:
	#docker build --cache-from type=local,src=.cache/docker --cache-to type=local,dest=.cache/docker -f Dockerfile.build -t `basename $(PWD)` .
	docker build -f build.Dockerfile -t $(shell basename $(PWD)) .

build:
	npm run build

check-tokens:
	npx ts-node -r tsconfig-paths/register ./src/scripts/check-tokens.ts
