
run\:%:
	@echo "Running $*"
	@make SERVER=$(*) run

dev\:%:
	@echo "Dev $*"
	@make SERVER=$(*) dev
