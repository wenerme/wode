import fs from 'node:fs/promises';
import { Value } from '@sinclair/typebox/value';
import YAML from 'yaml';
import { z } from 'zod';
import { GostConfig } from '@/poc/gost/types';
import { verifyNetflixProxy } from '@/poc/netflix/verifyNetflixProxy';

const RunAutoSwitchOptions = z.object({
  gost: z
    .object({
      config: z.string().optional().default('/etc/gost/gost.yaml'),
    })

    .default({})
    .optional(),
});
type RunAutoSwitchOptions = z.infer<typeof RunAutoSwitchOptions>;

export async function runGostAutoSwitch(opts: RunAutoSwitchOptions) {
  // load gost config
  // verify netflix
  // switch

  const { gost: { config = 'gost.yaml' } = {} } = RunAutoSwitchOptions.parse(opts);

  const conf = YAML.parse(await fs.readFile(config, 'utf-8')) as GostConfig;
  console.log(`Load gost config ${config}`);

  // random pick from nordvpn
  const groups = [
    {
      addrs: [
        'sg531.nordvpn.com:89',
        'sg546.nordvpn.com:89',
        'sg547.nordvpn.com:89',
        'sg548.nordvpn.com:89',
        'sg549.nordvpn.com:89',
        'sg550.nordvpn.com:89',
        'sg551.nordvpn.com:89',
        'sg552.nordvpn.com:89',
      ],
    },
    {
      addrs: [
        //
        'tw177.nordvpn.com:89',
        'tw179.nordvpn.com:89',
        'tw178.nordvpn.com:89',
        'tw179.nordvpn.com:89',
        //
      ],
    },
    {
      addrs: [
        'us9767.nordvpn.com:89',
        'us9754.nordvpn.com:89',
        'us9824.nordvpn.com:89',
        'us8247.nordvpn.com:89',
        'us10434.nordvpn.com:89',
      ],
    },
    {
      addrs: ['kr85.nordvpn.com:89', 'kr83.nordvpn.com:89'],
    },
  ];
  const candidate = groups.flatMap((v) => v.addrs);
  let nodes = conf.chains.flatMap((v) => {
    return v.hops.flatMap((v) => {
      return v.nodes.filter((v) => candidate.includes(v.addr));
    });
  });
  let before = Value.Hash(conf);

  nodes = nodes.filter((v) => v.connector?.type === 'http');

  console.log(`Found ${nodes.length} nodes with candidates`);

  for (const node of nodes) {
    const g = groups.find((v) => v.addrs.includes(node.addr));
    if (!g) {
      continue;
    }

    // test connections
    {
      const u = new URL(`http://${node.addr}`);
      if (node.dialer.type === 'tls') {
        u.protocol = 'https:';
      }
      if (node.connector?.auth?.username) {
        u.username = node.connector.auth.username;
        u.password = node.connector.auth.password ?? '';
      }
      const out = await verifyNetflixProxy({
        proxy: u.toString(),
      });

      console.log(
        [
          out.check.NonSelfMade ? '✅' : out.check.Available ? '⚠️' : '❌',
          out.country,
          //
          node.name,
          node.addr,
        ]
          .filter(Boolean)
          .join(' '),
      );

      if (out.check.NonSelfMade) {
        continue;
      }
    }

    for (let next of g.addrs.filter((v) => v !== node.addr)) {
      const u = new URL(`http://${next}`);
      if (node.dialer.type === 'tls') {
        u.protocol = 'https:';
      }
      if (node.connector?.auth?.username) {
        u.username = node.connector.auth.username;
        u.password = node.connector.auth.password ?? '';
      }
      const out = await verifyNetflixProxy({
        proxy: u.toString(),
      });
      console.log(
        [
          out.check.NonSelfMade ? '✅' : out.check.Available ? '⚠️' : '❌',
          out.country,
          //
          node.name,
          next,
        ]
          .filter(Boolean)
          .join(' '),
      );
      if (out.check.NonSelfMade) {
        node.addr = next;
        break;
      }
    }
  }

  const changed = Value.Hash(conf) !== before;
  if (changed) {
    console.log(`Update gost config ${config}`);
    await fs.writeFile(config, YAML.stringify(conf));
  }

  return {
    changed,
    config: conf,
  };
}
