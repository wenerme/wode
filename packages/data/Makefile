REPO_ROOT ?= $(shell git rev-parse --show-toplevel)
-include $(REPO_ROOT)/node.mk

bundle-system:
	$(EXEC) rollup -i src/index.ts -f system -p typescript -o dist/$(OUT_NAME).system.js



stat-size:
	du -sh cn
	du -sh *.json
