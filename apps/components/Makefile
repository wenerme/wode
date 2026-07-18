.PHONY: dev build storybook storybook-build registry-build verify deploy

dev:
	pnpm dev

build:
	pnpm build

storybook:
	pnpm storybook

storybook-build:
	pnpm build-storybook

registry-build:
	pnpm registry:build

verify:
	pnpm verify

deploy: build
	pnpm exec wrangler deploy
