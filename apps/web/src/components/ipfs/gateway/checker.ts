import { create } from 'mutative';

/**
 * https://github.com/ipfs/public-gateway-checker
 */

export interface GatewayCheckNodeState {
  id: number;
  index?: number;

  startTime: number;
  endTime?: number;

  gateway: string;
  hostname: string;

  status: CheckerState;
  cors: CheckerState;
  origin: CheckerState;

  error?: any;

  signal?: AbortSignal;
}

export type CheckStatus = 'new' | 'running' | 'error' | 'success';

export interface CheckerState {
  startTime: number;
  endTime: number;

  status: 'new' | 'running' | 'error' | 'success';

  error?: any;
  result?: any;
}

export function getGatewayCheckTextHash() {
  return CheckTextHash;
}

const CheckTextHash = 'bafybeifx7yeb55armcsxwwitkymga5xf53dxiarykms3ygqic223w5sk3m';
const CheckTextContent = 'Hello from IPFS Gateway Checker';
const CheckScriptHash = 'bafybeietzsezxbgeeyrmwicylb5tpvf7yutrm3bxrfaoulaituhbi7q6yi';

const GlobalResolver: Record<string, (...any: any[]) => void> = {};

export function fetchGatewayChecker(
  gateway: string,
  { hash = CheckTextHash, content = CheckTextContent, signal = undefined as AbortSignal | undefined } = {},
) {
  const gatewayAndHash = gateway.replace(':hash', hash);
  const now = Date.now();
  const testUrl = `${gatewayAndHash}?now=${now}#x-ipfs-companion-no-redirect`;

  return fetch(testUrl, { signal })
    .then((res) => {
      if (res.status >= 400) {
        throw new Error(`gateway ${gateway} request failed ${res.status}`);
      }
      return res;
    })
    .then((res) => res.text())
    .then((text) => {
      if (content) {
        const matched = content === text.trim();
        if (!matched) {
          throw new Error(`gateway ${gateway} content not match: ${text.trim()}`);
        }
      }
      return gateway;
    });
}

function checkCors({ getState }: CheckerOptions) {
  const { gateway, signal } = getState();
  return fetchGatewayChecker(gateway, { signal });
}

async function checkOrigin({ getState }: CheckerOptions) {
  const cidInSubdomain = getState().gateway.startsWith('https://:hash.ipfs.');
  if (cidInSubdomain) {
    return true;
  } else {
    throw new Error('cid not in sub-domain - expect start with "https://:hash.ipfs."');
  }
}

export function OnScriptloaded(src: string) {
  try {
    const url = new URL(src);
    const index = url.searchParams.get('i');
    const resolver = index && GlobalResolver[index];
    if (resolver) {
      resolver();
    } else {
      console.error(`no resolver found for ${index}`);
    }
  } catch (e) {
    // this is a URL exception, we can do nothing, user is probably using Internet Explorer
    console.error(`unexpected error: ${src}`, e);
  }
}

async function checkStatus({ getState }: CheckerOptions) {
  const { id, signal, gateway } = getState();
  const gatewayAndScriptHash = gateway.replace(':hash', CheckScriptHash);

  // we set a unused number as a url parameter, to try to prevent content caching
  // is it right ? ... do you know a better way ? ... does it always work ?
  const now = Date.now();

  // 3 important things here
  //   1) we add #x-ipfs-companion-no-redirect to the final url (self explanatory)
  //   2) we add ?filename=anyname.js as a parameter to let the gateway guess Content-Type header
  //      to be sent in headers in order to prevent CORB
  //   3) parameter 'i' is the one used to identify the gateway once the script executes
  const src = `${gatewayAndScriptHash}?i=${id}&now=${now}&filename=anyname.js#x-ipfs-companion-no-redirect`;

  // 不支持 abort - 除非 先 fetch
  if (signal) {
    await fetch(src, { signal }).then((v) => v.text());
  }

  // eslint-disable-next-line @typescript-eslint/return-await
  return new Promise((resolve, reject) => {
    try {
      const script = document.createElement('script');
      script.src = src;
      document.body.append(script);
      script.onerror = (e) => {
        // we check this because the gateway could be already checked by CORS before onerror executes
        // and, even though it is failing here, we know it is UP
        reject((e as any)?.error ?? e);
      };
      script.onload = (e) => {
        setTimeout(() => {
          reject(new Error('load script is invalid'));
        }, 500);
      };

      GlobalResolver[id] = (v) => {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete GlobalResolver[id];
        resolve(v);
      };
    } catch (e) {
      reject(e);
    }
  });
}

async function check(
  opts: CheckerOptions & { checker: (opts: CheckerOptions) => Promise<any>; name: 'status' | 'cors' | 'origin' },
) {
  const { onStateChange } = opts;
  const { checker, name, ...passBy } = opts;

  onStateChange((s) => {
    const check = s[name];

    check.status = 'running';
    check.startTime = Date.now();
  });

  try {
    const result = await checker(passBy);

    onStateChange((s) => {
      const check = s[name];
      if (check.status === 'running') {
        check.status = 'success';
      }
      check.result = result;
      check.endTime = Date.now();
    });
  } catch (e) {
    // const {gateway} = getState();
    // console.error(`check failed ${gateway} - ${name}`, e);
    onStateChange((s) => {
      const check = s[name];
      if (check.status === 'running') {
        check.status = 'error';
      }
      check.error = e;
      check.endTime = Date.now();
    });
  }
}

let _uid = 0;

export function compareCheckState(a: GatewayCheckNodeState, b: GatewayCheckNodeState) {
  if (a.status?.status === b.status?.status) {
    if (a.status?.status === 'success') {
      return a.status.endTime - a.status.startTime - (b.status.endTime - b.status.startTime);
    }

    return 0;
  }
  if (a.status?.status === 'success') {
    return -1;
  }
  if (b.status?.status === 'success') {
    return 1;
  }
  return 0;
}

export async function checkGateways(
  gateways: string[],
  onStateChange: (s: GatewayCheckNodeState[]) => void,
  { signal }: { signal?: AbortSignal } = {},
) {
  let state = new Array(gateways.length);

  await Promise.all(
    gateways.map((v, i) =>
      checkGateway(v, (s) => {
        state = create(state, (base) => {
          base[i] = s;
        });
        onStateChange(state);
      }),
    ),
  );
  return state;
}

interface CheckerOptions {
  getState: () => GatewayCheckNodeState;
  onStateChange: (update: (s: GatewayCheckNodeState) => void) => void;
}

export async function checkGateway(
  gateway: string,
  onStateChange: (s: GatewayCheckNodeState) => void,
  { signal }: { signal?: AbortSignal } = {},
) {
  let state: GatewayCheckNodeState = {
    id: _uid++,

    gateway,
    hostname: gatewayHostname(new URL(gateway.replace(':hash', CheckTextHash))),

    startTime: Date.now(),

    status: { status: 'new', startTime: 0, endTime: Infinity },
    cors: { status: 'new', startTime: 0, endTime: Infinity },
    origin: { status: 'new', startTime: 0, endTime: Infinity },

    signal,
  };
  onStateChange(state);

  const opts: CheckerOptions = {
    getState() {
      return state;
    },
    onStateChange(update) {
      const neo = create(state, update);
      if (neo === state) {
        return;
      }
      state = neo;
      onStateChange(state);
    },
  };

  await Promise.all([
    check({ ...opts, name: 'status', checker: checkStatus }),
    check({ ...opts, name: 'cors', checker: checkCors }),
    check({ ...opts, name: 'origin', checker: checkOrigin }),
  ]);

  opts.onStateChange((s) => {
    s.endTime = Date.now();
  });

  return state;
}

function gatewayHostname(url: URL | string) {
  if (url instanceof URL) url = url.hostname.toString();
  return url
    .replace(`${CheckTextHash}.ipfs.`, '') // skip .ipfs. in subdomain gateways
    .replace(`${CheckTextHash}.`, ''); // path-based
}
