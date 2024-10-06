import { verifyNetflixProxy, VerifyResult } from '@/poc/netflix/verifyNetflixProxy';

export interface RunNetflixCheckOptions {
  proxy?: string[];
  username?: string;
  password?: string;
  checkAll?: boolean;
}

export async function runNetflixCheck({ proxy, username, password, checkAll }: RunNetflixCheckOptions) {
  const all = (proxy ?? []).map((v) => v?.trim()).filter(Boolean);
  if (all.length === 0) {
    all.push('');
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
      u.username ||= username || '';
      u.password ||= password || '';
      proxy = u.toString();
    }
    // fixme spinners
    // if (all.length > 1) {
    //   console.log(`Verify ${id}`);
    // }

    const result = await verifyNetflixProxy({
      proxy,
    });

    console.log(
      [result.check.NonSelfMade ? '✅' : result.check.Available ? '⚠️' : '❌', id, result.country]
        .filter(Boolean)
        .join(' '),
    );

    out = {
      id,
      proxy,
      result,
    };
    // fount first valid
    if (!checkAll) {
      if (result.check.NonSelfMade) {
        break;
      }
    }
  }
  if (!out || !out.result) {
    // for tying
    throw Error();
  }

  // const { country, check } = out.result;
  // if (out.proxy) {
  //   console.log(`Proxy: ${out.id}`);
  // }
  // console.log(`Country: ${country}`);
  // console.log(
  //   Object.entries({ ...check })
  //     .map(([k, v]) => `${k}: ${v}`)
  //     .join('\n'),
  // );
}
