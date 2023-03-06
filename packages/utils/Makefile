REPO_ROOT ?= $(shell git rev-parse --show-toplevel)
-include $(REPO_ROOT)/node.mk

check-syntax:
	! grep '[?][?]' lib/**/*.js
	! grep '[?][.]' lib/**/*.js
