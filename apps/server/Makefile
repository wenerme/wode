REPO_ROOT ?= $(shell git rev-parse --show-toplevel)
-include $(REPO_ROOT)/server.mk

buf-fmt:
	buf format protos/wode/ -w

buf-gen:
	buf generate protos/wode
