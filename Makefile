REPO_ROOT ?= $(shell git rev-parse --show-toplevel)
-include $(REPO_ROOT)/base.mk

ifneq ("$(wildcard $(REPO_ROOT)/pnpm-lock.yaml)","")
    EXEC=pnpm exec
	PM=pnpm
else
	EXEC=npx
	PM=npm
endif

info:
	@echo `uname -a`
	@echo
	@echo DOCKER_REGISTRY=$(DOCKER_REGISTRY)
	@echo IMAGE_REGISTRY=$(IMAGE_REGISTRY)
	@echo CI=$(CI)

deploy:
	pnpm turbo run deploy --filter=@wener/dash --filter=@wener/apis --filter=@wener/server

test:
	$(EXEC) turbo run test
fmt:
	$(EXEC) turbo run fmt
build:
	$(EXEC) turbo run build --filter=console --filter=server
dev:
	$(EXEC) turbo run dev --parallel
clean:
	$(EXEC) turbo run clean --parallel

ci:
	$(PM) install --frozen-lockfile
	$(MAKE) buf-lint
	$(MAKE) buf-gen
	git diff --check
	git diff --exit-code -- proto buf.yaml buf.gen.yaml packages/common/src/protos
	$(EXEC) biome check . --diagnostic-level=error --max-diagnostics=1000
	$(PM) -r --if-present run typecheck
	$(EXEC) vp test run packages/wener-utils/src/langs/getObjectId.test.ts --config packages/wener-utils/vitest.config.ts
	$(EXEC) vp test run packages/wener-server/src/entity/defineEntity.test.ts packages/wener-server/src/entity/defineEntitySchemaClass.test.ts
	$(EXEC) vp test run packages/wener-common/src/fs/server/dbfs.test.ts

typedoc:
	-$(EXEC) typedoc --entryPointStrategy packages packages/{utils,reaction} --out out/typedoc --name "Wener Wode" --gitRemote git@github.com:wenerme/wode.git

ci-install:
	-command -v jq > /dev/null || yum install jq -y
	-command -v rsync > /dev/null || yum install rsync -y

ci-build:
	pnpm turbo run image-push --filter=@wener/dash --filter=@wener/apis --filter=@wener/server

# Vercel
ci-demo: ci-install
	$(EXEC) turbo run build --filter=@wener/demo --force
	$(MAKE) typedoc
	-mv out/typedoc apps/demo/public/docs

ci-apis: ci-install
	$(EXEC) turbo run build --filter=@wener/apis --force
	$(MAKE) typedoc
	-mv out/typedoc apps/apis/public/docs

outdated:
	pnpm outdated -r | grep -v lexical | grep -v '@tiptap' | grep -v '^├─'

prepare:
	npm add -g pnpm@latest

ifneq ($(wildcard buf.gen.yaml),)
buf-gen:
	buf generate
	node scripts/normalize-generated-protos.mjs

buf-fmt:
	buf format -w

buf-lint: buf-fmt
	buf lint
endif

buf-tools:
	pnpm install
