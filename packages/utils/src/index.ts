// arrays
export {
  firstOfMaybeArray,
  lastOfMaybeArray,
  arrayOfMaybeArray,
  objectOfMaybeArray,
  type MaybeArray,
} from './arrays/MaybeArray';
export { arrayFromAsync } from './arrays/arrayFromAsync';

// object
export { get } from './objects/get';
export { set } from './objects/set';
export { parseObjectPath } from './objects/parseObjectPath';
export { merge, type MergeOptions } from './objects/merge';

// async
export { createLazyPromise, type LazyPromise } from './asyncs/createLazyPromise';
export { setAsyncInterval, clearAsyncInterval } from './asyncs/AsyncInterval';
export { type MaybePromise } from './asyncs/MaybePromise';
// async - iterator
export { createAsyncIterator } from './asyncs/createAsyncIterator';
export { firstOfAsyncIterator } from './asyncs/firstOfAsyncIterator';
export { nextOfAsyncIterator } from './asyncs/nextOfAsyncIterator';
export { isIterator } from './asyncs/isIterator';

export { sleep } from './asyncs/sleep';
export { timeout, TimeoutError } from './asyncs/timeout';
export { isPromise } from './asyncs/isPromise';
// export * from './async/promiseOfCallback';

// langs
export { shallowEqual } from './langs/shallowEqual';
export { deepEqual } from './langs/deepEqual';
export { classOf } from './langs/classOf';
export { shallowClone } from './langs/shallowClone';
export { isClass } from './langs/isClass';
export { isDefined } from './langs/isDefined';
export { isEmptyObject } from './langs/isEmptyObject';
export { isPlainObject } from './langs/isPlainObject';
export { parseBoolean } from './langs/parseBoolean';
export { maybeFunction, type MaybeFunction } from './langs/MaybeFunction';
export { memoize } from './langs/memoize';

export { isUUID } from './validations/isUUID';
export { parseTimestamp } from './validations/parseTimestamp';

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
// should not export as sideEffect
// export { globalThis } from './isomorphics/globalThis';

// crypto
export { randomUUID } from './crypto/randomUUID';
export { getRandomValues } from './crypto/getRandomValues';
export { sha1, sha256, sha384, sha512 } from './crypto/hashing';
export { md5 } from './crypto/md5';
export { hex } from './crypto/base';
export { isULID, createULID, ulid, parseULID } from './crypto/ulid';
export { PEM } from './crypto/pem/pem';

// misc
export { createRandom } from './maths/random';

// network
export { type FetchLike, createFetchWith, createFetchWithLogging, dumpResponse, dumpRequest } from './fetch';

// bundled
export { default as ms } from './libs/ms';

// error
export { Errors, DetailError, type ErrorDetail, type ErrorDetailInit } from './errors/Errors';
// http
export { getHttpStatusText, isRetryableHttpStatus } from './http/HttpStatus';

export type * from './types';
