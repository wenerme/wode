EXEC:=npx

build:
	$(EXEC) turbo run build --filter=@wener/demo
dev:
	$(EXEC) turbo run dev --parallel
clean:
	$(EXEC) turbo run clean --parallel
