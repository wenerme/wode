// @generated by protoc-gen-es v2.2.2
// @generated from file wener/wode/bin/v1/BinStorageService.proto (package wener.wode.storage.bin.v1, syntax proto3)
/* eslint-disable */

import type { GenFile, GenMessage, GenService } from "@bufbuild/protobuf/codegenv1";
import type { Message } from "@bufbuild/protobuf";
import type { Timestamp } from "@bufbuild/protobuf/wkt";

/**
 * Describes the file wener/wode/bin/v1/BinStorageService.proto.
 */
export declare const file_wener_wode_bin_v1_BinStorageService: GenFile;

/**
 * 元数据信息，包括内容类型、编码方式、生存时间和加密方法等
 *
 * @generated from message wener.wode.storage.bin.v1.BinMeta
 */
export declare type BinMeta = Message<"wener.wode.storage.bin.v1.BinMeta"> & {
  /**
   * @generated from field: string key = 1;
   */
  key: string;

  /**
   * @generated from field: optional string title = 2;
   */
  title?: string;

  /**
   * 指定内容类型，例如 text/plain, application/json
   *
   * @generated from field: optional string content_type = 3;
   */
  contentType?: string;

  /**
   * 指定内容的编码方式，如 gzip
   *
   * @generated from field: optional string content_encoding = 4;
   */
  contentEncoding?: string;

  /**
   * 内容的创建时间
   *
   * @generated from field: google.protobuf.Timestamp create_time = 5;
   */
  createTime?: Timestamp;

  /**
   * 内容的过期时间
   *
   * @generated from field: optional google.protobuf.Timestamp expire_time = 6;
   */
  expireTime?: Timestamp;

  /**
   * 内容大小，以字节为单位
   *
   * @generated from field: int64 size = 7;
   */
  size: bigint;

  /**
   * 生存时间（TTL），以秒为单位
   *
   * @generated from field: int64 ttl = 8;
   */
  ttl: bigint;

  /**
   * 加密方法，例如 "AES-256", "RSA" 等
   *
   * @generated from field: string encrypt_method = 9;
   */
  encryptMethod: string;
};

/**
 * Describes the message wener.wode.storage.bin.v1.BinMeta.
 * Use `create(BinMetaSchema)` to create a new message.
 */
export declare const BinMetaSchema: GenMessage<BinMeta>;

/**
 * @generated from message wener.wode.storage.bin.v1.PutRequest
 */
export declare type PutRequest = Message<"wener.wode.storage.bin.v1.PutRequest"> & {
  /**
   * 指定 key，如果留空则自动生成
   *
   * @generated from field: string key = 1;
   */
  key: string;

  /**
   * 元数据信息（可选）
   *
   * @generated from field: wener.wode.storage.bin.v1.BinMeta meta = 2;
   */
  meta?: BinMeta;

  /**
   * @generated from oneof wener.wode.storage.bin.v1.PutRequest.content
   */
  content: {
    /**
     * 文本内容
     *
     * @generated from field: string text = 3;
     */
    value: string;
    case: "text";
  } | {
    /**
     * 二进制内容
     *
     * @generated from field: bytes binary = 4;
     */
    value: Uint8Array;
    case: "binary";
  } | { case: undefined; value?: undefined };
};

/**
 * Describes the message wener.wode.storage.bin.v1.PutRequest.
 * Use `create(PutRequestSchema)` to create a new message.
 */
export declare const PutRequestSchema: GenMessage<PutRequest>;

/**
 * @generated from message wener.wode.storage.bin.v1.PutResponse
 */
export declare type PutResponse = Message<"wener.wode.storage.bin.v1.PutResponse"> & {
  /**
   * 返回生成的唯一 key
   *
   * @generated from field: string key = 1;
   */
  key: string;
};

/**
 * Describes the message wener.wode.storage.bin.v1.PutResponse.
 * Use `create(PutResponseSchema)` to create a new message.
 */
export declare const PutResponseSchema: GenMessage<PutResponse>;

/**
 * @generated from message wener.wode.storage.bin.v1.GetRequest
 */
export declare type GetRequest = Message<"wener.wode.storage.bin.v1.GetRequest"> & {
  /**
   * 内容的唯一标识符
   *
   * @generated from field: string key = 1;
   */
  key: string;

  /**
   * 是否包含实际内容数据，false 时只返回元数据
   *
   * @generated from field: bool include_content = 2;
   */
  includeContent: boolean;
};

/**
 * Describes the message wener.wode.storage.bin.v1.GetRequest.
 * Use `create(GetRequestSchema)` to create a new message.
 */
export declare const GetRequestSchema: GenMessage<GetRequest>;

/**
 * @generated from message wener.wode.storage.bin.v1.GetResponse
 */
export declare type GetResponse = Message<"wener.wode.storage.bin.v1.GetResponse"> & {
  /**
   * 元数据信息
   *
   * @generated from field: wener.wode.storage.bin.v1.BinMeta meta = 1;
   */
  meta?: BinMeta;

  /**
   * @generated from oneof wener.wode.storage.bin.v1.GetResponse.content
   */
  content: {
    /**
     * 文本内容
     *
     * @generated from field: string text = 2;
     */
    value: string;
    case: "text";
  } | {
    /**
     * 二进制内容
     *
     * @generated from field: bytes binary = 3;
     */
    value: Uint8Array;
    case: "binary";
  } | { case: undefined; value?: undefined };
};

/**
 * Describes the message wener.wode.storage.bin.v1.GetResponse.
 * Use `create(GetResponseSchema)` to create a new message.
 */
export declare const GetResponseSchema: GenMessage<GetResponse>;

/**
 *  wode.resource.v1.ListQuery query = 1;
 *
 * @generated from message wener.wode.storage.bin.v1.ListRequest
 */
export declare type ListRequest = Message<"wener.wode.storage.bin.v1.ListRequest"> & {
};

/**
 * Describes the message wener.wode.storage.bin.v1.ListRequest.
 * Use `create(ListRequestSchema)` to create a new message.
 */
export declare const ListRequestSchema: GenMessage<ListRequest>;

/**
 * @generated from message wener.wode.storage.bin.v1.ListResponse
 */
export declare type ListResponse = Message<"wener.wode.storage.bin.v1.ListResponse"> & {
  /**
   * 当前页的内容元数据列表
   *
   * @generated from field: repeated wener.wode.storage.bin.v1.BinMeta data = 1;
   */
  data: BinMeta[];

  /**
   * 下一页的标记，如果没有更多数据则为空
   *
   * @generated from field: string next_page_token = 2;
   */
  nextPageToken: string;
};

/**
 * Describes the message wener.wode.storage.bin.v1.ListResponse.
 * Use `create(ListResponseSchema)` to create a new message.
 */
export declare const ListResponseSchema: GenMessage<ListResponse>;

/**
 * @generated from message wener.wode.storage.bin.v1.DeleteRequest
 */
export declare type DeleteRequest = Message<"wener.wode.storage.bin.v1.DeleteRequest"> & {
  /**
   * 要删除的内容唯一标识符
   *
   * @generated from field: string key = 1;
   */
  key: string;
};

/**
 * Describes the message wener.wode.storage.bin.v1.DeleteRequest.
 * Use `create(DeleteRequestSchema)` to create a new message.
 */
export declare const DeleteRequestSchema: GenMessage<DeleteRequest>;

/**
 * @generated from message wener.wode.storage.bin.v1.DeleteResponse
 */
export declare type DeleteResponse = Message<"wener.wode.storage.bin.v1.DeleteResponse"> & {
  /**
   * 是否成功删除
   *
   * @generated from field: bool success = 1;
   */
  success: boolean;

  /**
   * 删除操作的反馈信息
   *
   * @generated from field: string message = 2;
   */
  message: string;
};

/**
 * Describes the message wener.wode.storage.bin.v1.DeleteResponse.
 * Use `create(DeleteResponseSchema)` to create a new message.
 */
export declare const DeleteResponseSchema: GenMessage<DeleteResponse>;

/**
 * @generated from service wener.wode.storage.bin.v1.WodeBinService
 */
export declare const WodeBinService: GenService<{
  /**
   * 存储内容，返回生成的 key
   *
   * @generated from rpc wener.wode.storage.bin.v1.WodeBinService.Put
   */
  put: {
    methodKind: "unary";
    input: typeof PutRequestSchema;
    output: typeof PutResponseSchema;
  },
  /**
   * 获取指定 key 的内容
   *
   * @generated from rpc wener.wode.storage.bin.v1.WodeBinService.Get
   */
  get: {
    methodKind: "unary";
    input: typeof GetRequestSchema;
    output: typeof GetResponseSchema;
  },
  /**
   * 删除指定 key 的内容
   *
   * @generated from rpc wener.wode.storage.bin.v1.WodeBinService.Delete
   */
  delete: {
    methodKind: "unary";
    input: typeof DeleteRequestSchema;
    output: typeof DeleteResponseSchema;
  },
  /**
   * 列出内容的元数据，支持分页
   *
   * @generated from rpc wener.wode.storage.bin.v1.WodeBinService.List
   */
  list: {
    methodKind: "unary";
    input: typeof ListRequestSchema;
    output: typeof ListResponseSchema;
  },
}>;
