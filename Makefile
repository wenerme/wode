REPO_ROOT ?= $(shell git rev-parse --show-toplevel)
ifneq ("$(wildcard $(REPO_ROOT)/pnpm-lock.yaml)","")
    EXEC=pnpm exec
	PM=pnpm
else
	EXEC=npx
	PM=npm
endif

test:
	$(EXEC) turbo run test
fmt:
	$(EXEC) turbo run fmt
build:
	$(EXEC) turbo run build --filter=@wener/demo --filter=@wener/apis
build-force:
	$(EXEC) turbo run build --filter=@wener/demo --filter=@wener/apis --force
dev:
	$(EXEC) turbo run dev --parallel
clean:
	$(EXEC) turbo run clean --parallel

typedoc:
	$(EXEC) typedoc --entryPointStrategy packages 'packages/*' --out out/typedoc --name "Wener Wode" --gitRemote git@github.com:wenerme/wode.git

ci-install:
	-command -v jq > /dev/null || yum install jq -y
ci: ci-demo ci-apis

ci-demo: ci-install
	$(EXEC) turbo run build --filter=@wener/demo --force
	$(MAKE) typedoc
	mv out/typedoc apps/demo/public/docs

ci-apis: ci-install
	$(EXEC) turbo run build --filter=@wener/apis --force
	$(MAKE) typedoc
	mv out/typedoc apps/apis/public/docs

outdated:
	pnpm outdated -r | grep -v lexical | grep -v '@tiptap' | grep -v '^├─'
