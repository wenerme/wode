// https://github.com/nodejs/node/issues/30810
// https://github.com/yarnpkg/berry/blob/c26001a65a997dc5c2b3f219a12cb51247d7d50e/packages/yarnpkg-pnp/sources/loader/applyPatch.ts#L432-L453

'use strict';

// When using the ESM loader Node.js prints either of the following warnings
//
// - ExperimentalWarning: --experimental-loader is an experimental feature. This feature could change at any time
// - ExperimentalWarning: Custom ESM Loaders is an experimental feature. This feature could change at any time
//
// Having this warning show up once is "fine" but it's also printed
// for each Worker that is created so it ends up spamming stderr.
// Since that doesn't provide any value we suppress the warning.
const originalEmit = process.emit;
// @ts-expect-error - TS complains about the return type of originalEmit.apply
process.emit = function(name, data, ...args) {
  if (
    name === `warning` &&
    typeof data === `object` &&
    data.name === `ExperimentalWarning` &&
    (data.message.includes(`--experimental-loader`) ||
      data.message.includes(`Custom ESM Loaders is an experimental feature`))
  )
    return false;
  return originalEmit.apply(process, arguments);
};
