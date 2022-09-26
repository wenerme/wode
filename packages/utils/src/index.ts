// arrays
export {
  firstOfMaybeArray,
  lastOfMaybeArray,
  arrayOfMaybeArray,
  objectOfMaybeArray,
  type MaybeArray,
} from './arrays/MaybeArray';

// async
export { createLazyPromise, type LazyPromise } from './asyncs/LazyPromise';
export { setAsyncInterval, clearAsyncInterval } from './asyncs/AsyncInterval';
export { type MaybePromise } from './asyncs/MaybePromise';

export { sleep } from './asyncs/sleep';
export { timeout, TimeoutError } from './asyncs/timeout';
export { isPromise } from './asyncs/isPromise';
// export * from './async/promiseOfCallback';

// validations
export { isClass } from './validations/isClass';
export { isDefined } from './validations/isDefined';
export { isEmptyObject } from './validations/isEmptyObject';
export { shallow } from './validations/shallow';
export { dequal } from './validations/dequal';

// modules
export { parseModuleId, type ParsedModuleId } from './modules/parseModuleId';

// strings
export { pascalCase, camelCase } from './strings/camelCase';
export { templateString } from './strings/templates';

export { createRandom } from './maths/random';
export { isBuffer } from './io/isBuffer';

export { copy } from './browsers/copy';
export { download } from './browsers/download';
export { loadScripts, loadStyles } from './browsers/loaders';
export { getFileFromDataTransfer } from './browsers/getFileFromDataTransfer';

export { getGlobalThis } from './isomorphics/getGlobalThis';

export { formatBytes } from './formats/formatBytes';
export { urljoin } from './shim/urljoin';

// crypto
export { randomUUID } from './crypto/randomUUID';
export { sha1, sha256, sha384, sha512 } from './crypto/hashing';
export { hex } from './crypto/hex';
