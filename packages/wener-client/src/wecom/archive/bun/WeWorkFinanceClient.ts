import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { dlopen, FFIType, ptr, suffix, toBuffer, type Library, type Pointer, type Symbols } from 'bun:ffi';
import type { ArchiveMessage } from './../types';

type Handler = Pointer;
type MaybeFunction<T, P extends any[] = any[]> = T | ((...args: P) => T);

// bundle to make test easier

function maybeFunction<T, P extends any[] = any[]>(v: MaybeFunction<T, P>, ...args: P): T {
  // https://github.com/microsoft/TypeScript/issues/37663#issuecomment-759728342
  if (v instanceof Function) {
    return v(...args);
  }
  return v;
}

function arrayOfMaybeArray<T>(v: MaybeArray<T> | null | undefined): T[] {
  if (Array.isArray(v)) {
    return v;
  }
  if (v === null || v === undefined) {
    return [];
  }
  return [v];
}

type MaybeArray<T> = T | T[];

export interface GetChatDataRequest {
  sequence?: number | bigint;
  limit?: number;
  proxy?: string;
  proxyCredential?: string;
  timeout?: number;
}

export interface GetMediaDataRequest {
  index?: string;
  fileId: string;
  proxy?: string;
  proxyCredential?: string;
  timeout?: number;
}

export interface GetChatDataResponse {
  errcode?: number;
  errmsg?: string;
  chatdata: ChatData[];
}

export interface ChatData {
  seq: number; // 消息的seq值，标识消息的序号。再次拉取需要带上上次回包中最大的seq。Uint64类型，范围0-pow(2,64)-1
  msgid: string; // 消息id，消息的唯一标识，企业可以使用此字段进行消息去重。
  publickey_ver: number; // 加密此条消息使用的公钥版本号。
  encrypt_random_key: string; // 使用publickey_ver指定版本的公钥进行非对称加密后base64加密的内容，需要业务方先base64 decode处理后，再使用指定版本的私钥进行解密，得出内容。
  encrypt_chat_msg: string; // 消息密文。需要业务方使用将encrypt_random_key解密得到的内容，与encrypt_chat_msg，传入sdk接口DecryptData,得到消息明文。
  message?: Message; // 消息明文
}

export interface Message {
  msgid: string; // 消息id，消息的唯一标识，企业可以使用此字段进行消息去重。
  action: string; // 消息动作 - send(发送消息)/recall(撤回消息)/switch(切换企业日志)
  from: string; // 消息发送方id。同一企业内容为userid，非相同企业为external_userid。消息如果是机器人发出，也为external_userid。
  tolist: string[]; // 消息接收方列表，可能是多个，同一个企业内容为userid，非相同企业为external_userid。
  roomid: string; // 群聊消息的群id。如果是单聊则为空。
  msgtime: number; // 消息发送时间戳，utc时间，ms单位。
  msgtype: string; // 消息类型，具体数据见消息注释内容

  // 扩展字段
  sequence: number; // 消息序号
  corpId: string;
}

export class WeWorkFinanceSdkError extends Error {
  constructor(
    readonly code: number,
    readonly detail?: string,
  ) {
    super(CodeMessages[code] || `unknown error code ${code}`);
  }

  toString() {
    const { code, message, detail } = this;
    return `WeWorkFinanceSdkError(${code}): ${message}${detail ? ` ${detail}` : ''}`;
  }
}

export interface CreateWeWorkFinanceClientOptions extends Partial<WeWorkFinanceClientOptions> {
  corpId: string;
  corpSecret: string;
}

export interface WeWorkFinanceClientOptions {
  corpId: string;
  proxy?: string;
  proxyCredential?: string;
  timeout?: number;
  privateKey?: string;
  debug: boolean;
}

export type GetArchiveMessageItem = {
  sequence: number;
  corpId: string;
} & ArchiveMessage;

interface Logger {
  log: (s: string) => void;
  debug: (s: string) => void;
  error: (s: string) => void;
}

export class WeWorkFinanceClient {
  #sdk: Handler | undefined;
  readonly options: WeWorkFinanceClientOptions;
  readonly log: Logger;

  private constructor({ sdk, ...options }: { sdk: any } & Partial<WeWorkFinanceClientOptions>) {
    this.#sdk = sdk;
    this.options = {
      debug: false,
      corpId: '',
      ...options,
    };
    // this.log = new Logger(`WeWorkFinanceClient:${this.options.corpId}`);
    this.log = console;
  }

  get sdk() {
    let sdk = this.#sdk;
    if (sdk) return sdk;
    throw new Error('sdk is closed');
  }

  close() {
    if (this.#sdk) {
      const {
        symbols: { DestroySdk },
      } = loadLibrary();
      DestroySdk(this.#sdk);
      this.#sdk = undefined;
    }
  }

  debug(message: MaybeFunction<string>) {
    if (this.options.debug) {
      this.log.debug(maybeFunction(message));
    }
  }

  static create({ corpId, corpSecret, ...options }: CreateWeWorkFinanceClientOptions): WeWorkFinanceClient {
    const {
      symbols: { NewSdk, Init, DestroySdk },
    } = loadLibrary();
    let sdk: Handler | null = null;
    try {
      log.log(`create sdk for ${corpId}`);
      sdk = NewSdk()!;
      throwIfError(Init(sdk, ptrOfStr(corpId), ptrOfStr(corpSecret)), 'init');
    } catch (e) {
      log.error(`failed to create sdk for ${corpId}: ${e}`);
      DestroySdk(sdk);
      throw e;
    }
    return new WeWorkFinanceClient({ sdk, corpId, ...options });
  }

  decrypt(opts: { decryptKey?: string | Buffer; randomKey?: string; privateKey?: string; encrypted: string }): string {
    return decrypt({
      privateKey: this.options.privateKey,
      ...opts,
    });
  }

  getMessage(req: GetChatDataRequest): GetArchiveMessageItem[] {
    const res = this.getChatData(req);
    let out: GetArchiveMessageItem[] = [];
    for (let ele of res.chatdata) {
      let dec: string;
      try {
        dec = this.decrypt({
          randomKey: ele.encrypt_random_key,
          encrypted: ele.encrypt_chat_msg,
        });
      } catch (e) {
        this.log.error(
          [
            `failed to decrypt message:`,
            `#${ele.seq}`,
            this.options.corpId,
            ele.msgid,
            `pkVer=${ele.publickey_ver}`,
            String(e),
          ].join(' '),
        );
        this.debug(() => {
          return [
            'payload',
            JSON.stringify({
              randomKey: ele.encrypt_random_key,
              encrypted: ele.encrypt_chat_msg,
            }),
          ].join();
        });
        throw e;
      }

      let msg = JSON.parse(dec) as GetArchiveMessageItem;

      msg.sequence = ele.seq;
      msg.corpId = this.options.corpId;

      out.push(msg);
    }
    return out;
  }

  getMediaData({
    index,
    fileId,
    timeout = this.options.timeout ?? 0,
    proxy = this.options.proxy || '',
    proxyCredential = this.options.proxyCredential || '',
  }: GetMediaDataRequest): { data: Buffer } {
    this.debug(() => {
      return [
        `getMediaData #${fileId}`,
        `index: ${index}`,
        `timeout: ${timeout}`,
        `proxy: ${proxy}`,
        `proxyCredential: ${proxyCredential}`,
      ].join(' ');
    });

    const { sdk } = this;
    const {
      symbols: { GetMediaData, GetOutIndexBuf, GetData, GetIndexLen, GetDataLen, IsMediaDataFinish },
    } = loadLibrary();

    // 	int GetMediaData(WeWorkFinanceSdk_t *sdk, const char *indexbuf, const char *sdkFileid, const char *proxy, const char *passwd, int timeout, MediaData_t *media_data);

    // 会导致全部读取到内存，通过写入临时文件能够避免
    let data = Buffer.alloc(0);

    const mediaDataPtr = getMediaDataPtr();
    while (true) {
      throwIfError(
        GetMediaData(
          sdk,
          ptrOfStr(index),
          ptrOfStr(fileId),
          ptrOfStr(proxy),
          ptrOfStr(proxyCredential),
          timeout,
          mediaDataPtr,
        ),
        'GetMediaData',
      );
      const result = readMediaData(mediaDataPtr);
      index = result.index;
      // 必须要读取 chunk，否则会被覆盖
      data = Buffer.concat([data, result.chunk]);
      if (result.finished) {
        break;
      }
    }
    return {
      data,
    };
  }

  getChatData({
    sequence = 0,
    limit = 1000, // max 1000
    timeout = this.options.timeout ?? 0,
    proxy = this.options.proxy || '',
    proxyCredential = this.options.proxyCredential || '',
  }: GetChatDataRequest): GetChatDataResponse {
    this.debug(() => {
      return [
        `getChatData #${sequence}`,
        `limit: ${limit}`,
        `timeout: ${timeout}`,
        `proxy: ${proxy}`,
        `proxyCredential: ${proxyCredential}`,
      ].join(' ');
    });
    const {
      symbols: { GetChatData, NewSlice, FreeSlice, GetContentFromSlice },
    } = loadLibrary();
    const slice = NewSlice();
    try {
      throwIfError(
        GetChatData(this.sdk, sequence, limit, bufferOfString(proxy), bufferOfString(proxyCredential), timeout, slice),
        `getChatData #${sequence}`,
      );
      // const len = GetSliceLen(slice);
      const content = GetContentFromSlice(slice);
      const resp = JSON.parse(String(content)) as GetChatDataResponse;
      this.debug(() => {
        return [
          `getChatData #${sequence} response`,
          `code: ${resp.errcode}`,
          `msg: ${resp.errmsg}`,
          `count: ${resp.chatdata.length}`,
        ].join(', ');
      });
      requireSuccess(resp);
      return resp;
    } finally {
      FreeSlice(slice);
    }
  }
}

function bufferOfString(s?: string) {
  return s ? Buffer.from(`${s}\0`, 'utf8') : null;
}

function ptrOfStr(s?: string | Pointer) {
  if (typeof s === 'string') {
    // the buffer will held until string is freed
    let buf = Buffer.from(s + '\0', 'utf8');
    return ptr(buf);
  }
  return s ?? null;
}

function requireSuccess(o: { errcode?: number; errmsg?: string }, message?: string): void {
  if (o.errcode) {
    const detail = parseErrorMessage(o.errmsg);
    throw Object.assign(new Error(message || o.errmsg), detail, { code: o.errcode });
  }
}

function parseErrorMessage(m?: string) {
  if (!m) {
    return undefined;
  }
  const r = /(?<error>.*?), hint: \[(?<requestId>[^\]]+)].*?from ip: (?<ip>[^,]*?), more info at (?<url>.*)/;
  // avoid use message as key, conflict with Error.message
  const { error, requestId, ip, url } = m.match(r)?.groups ?? {};
  if (!ip) {
    return undefined;
  }
  return { error, requestId, ip, url };
}

// 服务端返回错误
// 301052 contract is over time.pls recharge - 会话存档服务已过期
// 301042 get chatdata whiteip not match - 会话存档服务IP白名单不匹配
const CodeMessages: Record<string, string> = {
  10000: '参数错误，请求参数错误',
  10001: '网络错误，网络请求错误',
  10002: '数据解析失败',
  10003: '系统失败',
  10004: '密钥错误导致加密失败',
  10005: 'fileid错误',
  10006: '解密失败',
  10007: '找不到消息加密版本的私钥，需要重新传入私钥对',
  10008: '解析encrypt_key出错',
  10009: 'ip非法',
  10010: '数据过期',
  10011: '证书错误',
};
const WeWorkFinanceSymbols = {
  // WeWorkFinanceSdk_t *NewSdk();
  NewSdk: { args: [], returns: FFIType.ptr },
  // void DestroySdk(WeWorkFinanceSdk_t *sdk);
  DestroySdk: { args: [FFIType.ptr], returns: FFIType.void },
  // int Init(WeWorkFinanceSdk_t *sdk, const char *corpid, const char *secret);
  Init: { args: [FFIType.ptr, FFIType.cstring, FFIType.cstring], returns: FFIType.i32 },
  // int GetChatData(WeWorkFinanceSdk_t *sdk, unsigned long long seq, unsigned int limit, const char *proxy, const char *passwd, int timeout, Slice_t *chatDatas);
  GetChatData: {
    args: [FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.cstring, FFIType.cstring, FFIType.i32, FFIType.ptr],
    returns: FFIType.i32,
  },
  // int GetMediaData(WeWorkFinanceSdk_t *sdk, const char *indexbuf,
  // 					 const char *sdkFileid, const char *proxy, const char *passwd, int timeout, MediaData_t *media_data);
  GetMediaData: {
    args: [FFIType.ptr, FFIType.cstring, FFIType.cstring, FFIType.cstring, FFIType.cstring, FFIType.i32, FFIType.ptr],
    returns: FFIType.i32,
  },

  // Slice_t *NewSlice();
  NewSlice: { args: [], returns: FFIType.ptr },
  // void FreeSlice(Slice_t *slice);
  FreeSlice: { args: [FFIType.ptr], returns: FFIType.void },
  // int GetSliceLen(Slice_t *slice);
  GetSliceLen: { args: [FFIType.ptr], returns: FFIType.i32 },
  // char *GetContentFromSlice(Slice_t *slice);
  GetContentFromSlice: { args: [FFIType.ptr], returns: FFIType.cstring },
  // int DecryptData(const char *encrypt_key, const char *encrypt_msg, Slice_t *msg);
  DecryptData: { args: [FFIType.cstring, FFIType.cstring, FFIType.ptr], returns: FFIType.i32 },

  //region MediaData

  // MediaData_t *NewMediaData();
  NewMediaData: { args: [], returns: FFIType.ptr },
  // void FreeMediaData(MediaData_t *media_data);
  FreeMediaData: { args: [FFIType.ptr], returns: FFIType.void },
  // char *GetOutIndexBuf(MediaData_t *media_data);
  GetOutIndexBuf: { args: [FFIType.ptr], returns: FFIType.cstring },
  // char *GetData(MediaData_t *media_data);
  GetData: { args: [FFIType.ptr], returns: FFIType.ptr },
  // int GetIndexLen(MediaData_t *media_data);
  GetIndexLen: { args: [FFIType.ptr], returns: FFIType.i32 },
  // int GetDataLen(MediaData_t *media_data);
  GetDataLen: { args: [FFIType.ptr], returns: FFIType.i32 },
  // int IsMediaDataFinish(MediaData_t *media_data);
  IsMediaDataFinish: { args: [FFIType.ptr], returns: FFIType.i32 },

  //endregion
} satisfies Symbols;

function throwIfError(code: number, detail?: string) {
  if (!code) {
    return;
  }
  throw new WeWorkFinanceSdkError(code, detail);
}

type WeWorkFinanceLibrary = Library<typeof WeWorkFinanceSymbols>;

// const log = new Logger('WeWorkFinanceSDK');
const log = console;
let _library: WeWorkFinanceLibrary;

function findLibrary({ filename, paths }: { filename: string; paths: MaybeArray<string | undefined | null> }) {
  let f: string | undefined;
  for (let v of arrayOfMaybeArray(paths)
    .filter(Boolean)
    .flatMap((v) => v.split(/[:;]/))
    .filter(Boolean)) {
    try {
      let stat = fs.statSync(v);
      if (stat.isDirectory()) {
        let p = path.join(v, filename);
        if (fs.existsSync(p)) {
          f = p;
        }
      } else {
        f = v;
      }
    } catch (e) {}

    if (f) {
      break;
    }
  }

  return f;
}

export function loadLibrary({
  filename,
  paths,
}: {
  filename?: string;
  paths?: MaybeArray<string>;
} = {}): WeWorkFinanceLibrary {
  if (_library) return _library;
  let f = findLibrary({
    filename: filename || `libWeWorkFinanceSdk_C.${suffix}`,
    paths: paths || getLibraryPath(),
  });

  if (!f) {
    throw new Error(`Library file not found: tried ${paths}`);
  }
  log.log(`load library from ${f}`);
  return (_library ||= dlopen(f, WeWorkFinanceSymbols));
}

function loadLibrarySymbols() {
  return loadLibrary().symbols;
}

function getLibraryPath() {
  return [
    //
    `./libs/WeWorkFinanceSdk`,
    `./libs`,
    process.env.WWF_LIBRARY_PATH,
    process.env.LD_LIBRARY_PATH,
  ].filter(Boolean);
}

export function createWeWorkFinanceClientFromEnv({
  env = process.env,
  ...opts
}: Partial<CreateWeWorkFinanceClientOptions> & {
  env?: Record<string, any>;
} = {}) {
  let file = env.WWF_PRIVATE_KEY_FILE;
  let privateKey;
  if (file) {
    privateKey = fs.readFileSync(file, 'utf8');
  }
  return WeWorkFinanceClient.create({
    corpId: env.WWF_CORP_ID || '',
    corpSecret: env.WWF_CORP_SECRET || '',
    proxyCredential: env.WWF_PROXY_CREDENTIAL || '',
    proxy: env.WWF_PROXY || '',
    timeout: Number(env.WWF_TIMEOUT) || 0,
    privateKey,
    ...opts,
  });
}

function maybeBase64(v: string | Buffer) {
  return typeof v === 'string' ? Buffer.from(v, 'base64') : v;
}

export function decrypt({
  randomKey,
  decryptKey,
  privateKey,
  encrypted,
}: {
  decryptKey?: string | Buffer;
  randomKey?: string | Buffer;
  privateKey?: string;
  encrypted: string;
}): string {
  if (!decryptKey && randomKey && privateKey) {
    decryptKey = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      maybeBase64(randomKey),
    );
  }
  if (!decryptKey) {
    throw new Error(`No decrypt key`);
  }
  decryptKey = maybeBase64(decryptKey);

  const {
    symbols: { GetContentFromSlice, DecryptData },
  } = loadLibrary();
  const slice = getSlicePtr();

  try {
    throwIfError(DecryptData(ptr(decryptKey), ptrOfStr(encrypted), slice), `DecryptData`);
    // console.log(
    //   `A`,
    //   slice,
    //   //
    //   `B`,
    //   GetContentFromSlice(slice).ptr,
    //   `C`,
    //   read.ptr(slice, 0),
    //   read.u32(slice, 8), // len
    // );
    const content = GetContentFromSlice(slice);
    return String(content);
  } catch (e) {
    log.error(`failed to decrypt: ${e}`);
    throw e;
  } finally {
    // FreeSlice(slice);
  }
}

// nodejs is single thread, it's safe to use global variable, reduce frequent allocation
let slice$: Pointer;
let media$: Pointer;

function readMediaData(ptr = getMediaDataPtr()) {
  /*
typedef struct MediaData
{
char *outindexbuf;
int out_len;
char *data;
int data_len;
int is_finish;
} MediaData_t;
 */
  const { GetDataLen, GetData, IsMediaDataFinish, GetOutIndexBuf } = loadLibrarySymbols();
  // console.log(
  //   `Direct`,
  //   {
  //     // Range:bytes=524288-655711
  //     // outindexbuf: read.cstring(ptr, 0),
  //     indexLen: read.i32(ptr, 8),
  //     // data: read.cstring(ptr, 16),
  //     dataLen: read.i32(ptr, 24),
  //     finished: read.i32(ptr, 28),
  //   },
  //   `Manual`,
  //   {
  //     index: String(GetOutIndexBuf(ptr)),
  //     indexLen: GetIndexLen(ptr),
  //     dataLen: GetDataLen(ptr),
  //     finished: IsMediaDataFinish(ptr),
  //   },
  // );
  const len = GetDataLen(ptr);
  let chunk = toBuffer(GetData(ptr)!, 0, len);
  return {
    index: String(GetOutIndexBuf(ptr)),
    finished: Boolean(IsMediaDataFinish(ptr)),
    chunk,
    // outindexbuf: read.cstring(ptr, 0),
    // size: read.i32(ptr, 8),
    // data: read.cstring(ptr, 16),
    // chunkSize: read.i32(ptr, 24),
    // finished: read.i32(ptr, 32),
  };
}

function getMediaDataPtr() {
  if (media$) return media$;
  const {
    symbols: { NewMediaData },
  } = loadLibrary();
  return (media$ = NewMediaData()!);
}

function getSlicePtr() {
  if (slice$) return slice$;
  const {
    symbols: { NewSlice },
  } = loadLibrary();
  return (slice$ = NewSlice()!);
}

// const { free } = dlopen('/lib/x86_64-linux-gnu/libc.so.6', {
//   free: { args: [FFIType.ptr], returns: FFIType.void },
// }).symbols;
