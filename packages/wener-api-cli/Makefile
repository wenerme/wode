-include .env .env.local

gen:
	jq -r '"// Generated file - do not edit manually\nexport const VERSION = \"\(.version)\";\n"' package.json > src/const.gen.ts

publish:
	pnpm version patch --no-git-tag-version
	$(MAKE) gen
	pnpm publish --no-git-checks

.PHONY: gen publish
