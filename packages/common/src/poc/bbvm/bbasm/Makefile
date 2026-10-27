gen:
	npx -y peggy $(PWD)/bbasm.pegjs -o $(PWD)/parser.js --format es --allowed-start-rules Grammar,Assembly
	bun fmt --no-script --config $(shell git rev-parse --show-toplevel)/.prettierrc.json --write $(PWD)/parser.js # .js.map 失效
