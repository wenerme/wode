// import type * as NodeCrypto from 'node:crypto';
import { getGlobalThis } from '../web/getGlobalThis';

let nodeCrypto;
// globalThis.process?.release?.name

// avoid import node
// avoid process.browser
// if (typeof window === 'undefined') {
//   try {
//     // avoid `node:` UnhandledSchemeError https://github.com/vercel/next.js/issues/28774
//     if (typeof require === 'undefined') {
//       void import('crypto').then((v) => (nodeCrypto = v.default));
//     } else {
//       nodeCrypto = require('crypto');
//     }
//   } catch (e) {}
// }
export function getNodeCrypto() {
  nodeCrypto ||= getGlobalThis().crypto;
  return nodeCrypto;
}
