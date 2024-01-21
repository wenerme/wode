import path from 'node:path';
import { ethers } from 'ethers';
import { writeFileSync } from 'fs';
import { sepolia } from 'viem/chains';
import { test } from 'vitest';
import Out from './GeoWeb.json';
import contracts from './contracts.json';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

test('gen', async () => {
  // split contracts
  await gen();

  // GeoWeb
  // https://github.com/Geo-Web-Project/core-contracts/blob/main/contracts/registry/interfaces/IRegistryDiamond.sol
  // https://github.com/solidstate-network/solidstate-solidity/blob/master/contracts/proxy/diamond/readable/IDiamondReadable.sol
});

test('provider', async () => {
  const prov = new ethers.JsonRpcProvider(sepolia.rpcUrls.default.http.at(0), {
    name: sepolia.name,
    chainId: sepolia.id,
  });

  // chain_id
  console.log(await prov.send('net_version', []));
});

async function gen() {
  let byName = contracts as any as Record<string, ContractInfo>;
  Object.assign(byName, Out);

  const shouldOut = new Set(Object.keys(Out).concat(Object.values(Out).flatMap((v) => v.extends ?? [])));
  console.log(`Write`, Array.from(shouldOut));

  for (const [name, c] of Object.entries(byName)) {
    if (c.abstract) {
      continue;
    }
    const collect = (names: string[] = []): string[] => {
      return names.flatMap((v) => {
        let info = byName[v];
        if (!info) {
          throw new Error(`contract not found: ${v}`);
        }

        return names.concat(collect(info.extends));
      });
    };
    const exts = Array.from(new Set(collect(c.extends)));

    let abi = c.abi.concat(exts.flatMap((v) => byName[v]!.abi));
    // let total = abi.length;
    // abi = _.uniqBy(abi, (v) => ethers.utils.id(v));
    // if (abi.length !== total) {
    //   console.warn(`${name} has duplicate abi entries: ${total} -> ${abi.length}`);
    // }
    console.log(`${name} has ${abi.length} abi entries`);

    let iface = new ethers.Interface(abi);

    const out = (JSON.parse(iface.formatJson()) as ethers.Fragment[]).sort((a, b) => {
      // function, event
      if (a.type !== b.type) {
        return b.type.localeCompare(a.type);
      }
      return a.name.localeCompare(b.name);
    });
    // let out = iface.format(ethers.utils.FormatTypes.json);
    if (shouldOut.has(name)) {
      writeFileSync(path.resolve(__dirname, `./abi/${name}.json`), JSON.stringify(out, null, 2));
    }
  }
}

interface ContractInfo {
  abstract?: boolean;
  extends: string[];
  abi: string[];
}
