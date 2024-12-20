import { Promises } from './asyncs/Promises';

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
export { computeIfAbsent } from './objects/computeIfAbsent';
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

export { Promises } from './asyncs/Promises';
export const sleep = Promises.sleep;
export const isPromise = Promises.isPromise;
export { timeout, TimeoutError } from './asyncs/timeout';

// langs
export { shallowEqual } from './langs/shallowEqual';
export { deepEqual } from './langs/deepEqual';
export { deepFreeze } from './langs/deepFreeze';
export { classOf } from './langs/classOf';
export { shallowClone } from './langs/shallowClone';
export { isClass } from './langs/isClass';
export { isDefined } from './langs/isDefined';
export { isEmptyObject } from './langs/isEmptyObject';
export { isPlainObject } from './langs/isPlainObject';
export { ifPresent } from './langs/ifPresent';
export { parseBoolean } from './langs/parseBoolean';
export { maybeFunction, type MaybeFunction } from './langs/MaybeFunction';
export { memoize } from './langs/memoize';
export { mixin } from './langs/mixin';
export type { MixinFunction, MixinInstance, MixinReturnValue } from './langs/mixin';
export { getObjectId } from './langs/getObjectId';
export { getGlobalStates, setGlobalStates } from './langs/getGlobalStates';

export { AsyncCloser } from './langs/AsyncCloser';
export { Closer } from './langs/Closer';

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
export { ByteBuffer } from './io/ByteBuffer';
export { fromHexDump, toHexDump } from './io/dump';
export { Buffer } from './io/Buffer';
export { parseDataUri, type ParsedDataUri } from './io/parseDataUri';
export type { AbstractEncoding } from './io/AbstractEncoding';

// browser
export { copy } from './browsers/copy';
export { download } from './browsers/download';
export { loadScripts, loadStyles } from './browsers/loaders';
export { getFileFromDataTransfer } from './browsers/getFileFromDataTransfer';
// web & spec
export { requestIdleCallback, cancelIdleCallback } from './web/requestIdleCallback';
export { randomUUID } from './web/randomUUID';
export { getRandomValues } from './web/getRandomValues';
export { getGlobalThis } from './web/getGlobalThis';
export { structuredClone } from './web/structuredClone';

// crypto
export { sha1, sha256, sha384, sha512, hmac, type DigestOptions } from './crypto/hashing';
export { md5 } from './crypto/md5';
export { hex } from './crypto/base';
export { isULID, createULID, ulid, parseULID } from './crypto/ulid';
export { PEM } from './crypto/pem/pem';

// math
export { createRandom } from './maths/random';
export { clamp } from './maths/clamp';

// network
export {
  type FetchLike,
  createFetchWith,
  createFetchWithLogging,
  dumpResponse,
  dumpRequest,
  createFetchWithRetry,
  type FetchWithRetryOptions,
} from './fetch';

// bundled
export { default as ms } from './libs/ms';

// error
export { Errors, DetailError, type ErrorDetail, type ErrorDetailInit } from './errors/Errors';
// http
export { getHttpStatusText, isRetryableHttpStatus } from './fetch/HttpStatus';

export type * from './types';
