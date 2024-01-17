import meow from 'meow';
import { verify, VerifyResult } from './verify';

const cli = meow(
  `
	Usage
	  $ netflix-verify <input>
	Options
	  --proxy, -x   Use proxy
	  --help        Show this message
	  --version     Show version information
`,
  {
    importMeta: import.meta,
    flags: {
      proxy: {
        type: 'string',
        shortFlag: 'x',
      },
      username: {
        type: 'string',
        shortFlag: 'u',
      },
      password: {
        type: 'string',
        shortFlag: 'p',
      },
    },
  },
);

{
  const all = [cli.flags.proxy, ...cli.input].map((v) => v?.trim()).filter(Boolean);
  if (all.length === 0) {
    all.push(undefined);
  }
  let out:
    | {
        id: string;
        proxy: string;
        result: VerifyResult | undefined;
      }
    | undefined;
  for (let proxy of all) {
    let id = proxy || 'direct';
    if (proxy) {
      let u = new URL(proxy);
      u.username = '';
      u.password = '';
      id = u.toString();
      u = new URL(proxy);
      u.username ||= cli.flags.username;
      u.password ||= cli.flags.password;
      proxy = u.toString();
    }
    if (all.length > 1) {
      console.log(`Verify ${id}`);
    }

    const result = await verify({
      proxy,
    });
    out = {
      id,
      proxy,
      result,
    };
    // fount first valid
    if (result.check.NonSelfMade) {
      break;
    }
  }
  if (!out || !out.result) {
    // for tying
    throw Error();
  }

  const { country, check } = out.result;
  if (out.proxy) {
    console.log(`Proxy: ${out.id}`);
  }
  console.log(`Country: ${country}`);
  console.log(
    Object.entries({ ...check })
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n'),
  );
}
