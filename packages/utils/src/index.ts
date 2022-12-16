// arrays
export {
  firstOfMaybeArray,
  lastOfMaybeArray,
  arrayOfMaybeArray,
  objectOfMaybeArray,
  type MaybeArray,
} from './arrays/MaybeArray';

// object
export { get } from './objects/get';
export { set } from './objects/set';
export { parseObjectPath } from './objects/parseObjectPath';

// async
export { createLazyPromise, type LazyPromise } from './asyncs/createLazyPromise';
export { setAsyncInterval, clearAsyncInterval } from './asyncs/AsyncInterval';
export { type MaybePromise } from './asyncs/MaybePromise';

export { sleep } from './asyncs/sleep';
export { timeout, TimeoutError } from './asyncs/timeout';
export { isPromise } from './asyncs/isPromise';
// export * from './async/promiseOfCallback';

// langs
export { shallowEqual } from './langs/shallowEqual';
export { deepEqual } from './langs/deepEqual';
export { classOf } from './langs/classOf';
export { shallowClone } from './langs/shallowClone';

// assertions
export { isClass } from './validations/isClass';
export { isDefined } from './validations/isDefined';
export { isEmptyObject } from './validations/isEmptyObject';
export { isUUID } from './validations/isUUID';
export { isPlainObject } from './validations/isPlainObject';
export { parseTimestamp } from './validations/parseTimestamp';
export { parseBoolean } from './validations/parseBoolean';

// modules
export { parseModuleId, type ParsedModuleId } from './modules/parseModuleId';
export { isModule, type Module } from './modules/isModule';

// logging
export { type Logger, type LogLevel } from './logging/Logger';
export { createLogger } from './logging/createLogger';
export { createNoopLogger } from './logging/createNoopLogger';
export { createChildLogger } from './logging/createChildLogger';

// strings
export { pascalCase, camelCase } from './strings/camelCase';
export { renderTemplate } from './strings/renderTemplate';
export { formatBytes } from './strings/formatBytes';

// i18n
export { createTranslate } from './i18n/createTranslate';

// io
export { isBuffer } from './io/isBuffer';
export { isTransferable } from './io/isTransferable';
export { ArrayBuffers } from './io/ArrayBuffers';
export { Buffer } from './io/Buffer';
export type { AbstractEncoding } from './io/AbstractEncoding';

// browser
export { copy } from './browsers/copy';
export { download } from './browsers/download';
export { loadScripts, loadStyles } from './browsers/loaders';
export { getFileFromDataTransfer } from './browsers/getFileFromDataTransfer';

// polyfills
export { getGlobalThis } from './isomorphics/getGlobalThis';
export { structuredClone } from './isomorphics/structuredClone';

// crypto
export { randomUUID } from './crypto/randomUUID';
export { getRandomValues } from './crypto/getRandomValues';
export { sha1, sha256, sha384, sha512 } from './crypto/hashing';
export { hex } from './crypto/base';
export { isULID, createULID, ulid, parseULID } from './crypto/ulid';

// misc
export { createRandom } from './maths/random';

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;
