.PHONY: build clean dev test

build:
	node --loader ts-node/esm src/scripts/bundle.ts
	chmod +x dist/main.mjs

clean:
	rm -rf dist

dev:
	node --loader ts-node/esm src/main.ts

test:
	pnpm vitest

install:
	pnpm install

.DEFAULT_GOAL := build
