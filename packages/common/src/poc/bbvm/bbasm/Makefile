gen:
	npx -y peggy $(PWD)/bbasm.pegjs -o $(PWD)/parser.js --format es --allowed-start-rules Grammar,Assembly
	pnpm exec vp fmt $(PWD)/parser.js # .js.map 失效
