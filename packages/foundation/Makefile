REPO_ROOT ?= $(shell git rev-parse --show-toplevel)
-include $(REPO_ROOT)/node.mk

check-syntax:
	! grep '[?][?]' lib/**/*.js
	! grep '[?][.]' lib/**/*.js

fmt-pkg:
	pnpm tsx $(REPO_ROOT)/cli.ts pkg fmt --write
	pnpm prettier --write package.json
