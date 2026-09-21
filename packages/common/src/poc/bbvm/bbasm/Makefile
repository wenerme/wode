gen:
	npx -y peggy $(PWD)/bbasm.pegjs -o $(PWD)/parser.js --format es --allowed-start-rules Grammar,Assembly
	pnpm exec biome format --write $(PWD)/parser.js # .js.map 失效
