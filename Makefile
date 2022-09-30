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
install:
	npm i -g $(PM)
	$(PM) install

typedoc:
	$(EXEC) typedoc --entryPointStrategy packages 'packages/*' --out out/typedoc

ci: install typedoc build
	mv out/typedoc apps/demo/public/docs
