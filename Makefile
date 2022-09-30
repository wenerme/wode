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
	$(EXEC) turbo run build --filter=@wener/demo
build-force:
	$(EXEC) turbo run build --filter=@wener/demo --force
dev:
	$(EXEC) turbo run dev --parallel
clean:
	$(EXEC) turbo run clean --parallel

typedoc:
	$(EXEC) typedoc --entryPointStrategy packages 'packages/*' --out out/typedoc --name "Wener Wode" --gitRemote git@github.com:wenerme/wode.git

# Already install when vercel-install
# install will remove dev deps
ci-install:
	npm i -g $(PM)
	$(PM) install
ci: build typedoc
	mv out/typedoc apps/demo/public/docs
