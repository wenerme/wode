SHELL:=env bash -O extglob -O globstar

gen-typechain:
	mkdir -p ./generated
	rm -rf ./generated/*
	npx -y typechain --target=ethers-v6 --discriminate-types --out-dir $(PWD)/generated "$(PWD)/abi/*.json"

install:
	pnpm add -D @typechain/ethers-v6 typechain

clean:
	rm -rf ./generated/*
	rm -rf ./abi/*
