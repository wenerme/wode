// @generated by protoc-gen-es v2.2.2
// @generated from file wode/storage/object/v1/ObjectStorageService.proto (package wode.storage.object.v1, syntax proto3)
/* eslint-disable */

import type { GenFile, GenMessage, GenService } from "@bufbuild/protobuf/codegenv1";
import type { Message } from "@bufbuild/protobuf";
import type { Timestamp } from "@bufbuild/protobuf/wkt";

/**
 * Describes the file wode/storage/object/v1/ObjectStorageService.proto.
 */
export declare const file_wode_storage_object_v1_ObjectStorageService: GenFile;

/**
 * @generated from message wode.storage.object.v1.ObjectRef
 */
export declare type ObjectRef = Message<"wode.storage.object.v1.ObjectRef"> & {
  /**
   * @generated from field: string bucket = 1;
   */
  bucket: string;

  /**
   * @generated from field: string name = 2;
   */
  name: string;
};

/**
 * Describes the message wode.storage.object.v1.ObjectRef.
 * Use `create(ObjectRefSchema)` to create a new message.
 */
export declare const ObjectRefSchema: GenMessage<ObjectRef>;

/**
 * @generated from message wode.storage.object.v1.ObjectMeta
 */
export declare type ObjectMeta = Message<"wode.storage.object.v1.ObjectMeta"> & {
  /**
   * @generated from field: string name = 1;
   */
  name: string;

  /**
   * @generated from field: string prefix = 2;
   */
  prefix: string;

  /**
   * @generated from field: int64 size = 3;
   */
  size: bigint;

  /**
   * @generated from field: string etag = 4;
   */
  etag: string;

  /**
   * @generated from field: optional google.protobuf.Timestamp ctime = 6;
   */
  ctime?: Timestamp;

  /**
   * @generated from field: optional google.protobuf.Timestamp mtime = 7;
   */
  mtime?: Timestamp;

  /**
   * @generated from field: map<string, string> metadata = 8;
   */
  metadata: { [key: string]: string };
};

/**
 * Describes the message wode.storage.object.v1.ObjectMeta.
 * Use `create(ObjectMetaSchema)` to create a new message.
 */
export declare const ObjectMetaSchema: GenMessage<ObjectMeta>;

/**
 * @generated from message wode.storage.object.v1.BucketMeta
 */
export declare type BucketMeta = Message<"wode.storage.object.v1.BucketMeta"> & {
  /**
   * @generated from field: string name = 1;
   */
  name: string;

  /**
   * @generated from field: google.protobuf.Timestamp created_at = 2;
   */
  createdAt?: Timestamp;
};

/**
 * Describes the message wode.storage.object.v1.BucketMeta.
 * Use `create(BucketMetaSchema)` to create a new message.
 */
export declare const BucketMetaSchema: GenMessage<BucketMeta>;

/**
 * @generated from message wode.storage.object.v1.ListBucketRequest
 */
export declare type ListBucketRequest = Message<"wode.storage.object.v1.ListBucketRequest"> & {
};

/**
 * Describes the message wode.storage.object.v1.ListBucketRequest.
 * Use `create(ListBucketRequestSchema)` to create a new message.
 */
export declare const ListBucketRequestSchema: GenMessage<ListBucketRequest>;

/**
 * @generated from message wode.storage.object.v1.ListBucketResponse
 */
export declare type ListBucketResponse = Message<"wode.storage.object.v1.ListBucketResponse"> & {
  /**
   * @generated from field: repeated wode.storage.object.v1.BucketMeta data = 1;
   */
  data: BucketMeta[];
};

/**
 * Describes the message wode.storage.object.v1.ListBucketResponse.
 * Use `create(ListBucketResponseSchema)` to create a new message.
 */
export declare const ListBucketResponseSchema: GenMessage<ListBucketResponse>;

/**
 * @generated from message wode.storage.object.v1.MakeBucketRequest
 */
export declare type MakeBucketRequest = Message<"wode.storage.object.v1.MakeBucketRequest"> & {
  /**
   * @generated from field: string name = 1;
   */
  name: string;
};

/**
 * Describes the message wode.storage.object.v1.MakeBucketRequest.
 * Use `create(MakeBucketRequestSchema)` to create a new message.
 */
export declare const MakeBucketRequestSchema: GenMessage<MakeBucketRequest>;

/**
 * @generated from message wode.storage.object.v1.MakeBucketResponse
 */
export declare type MakeBucketResponse = Message<"wode.storage.object.v1.MakeBucketResponse"> & {
  /**
   * @generated from field: wode.storage.object.v1.BucketMeta data = 1;
   */
  data?: BucketMeta;
};

/**
 * Describes the message wode.storage.object.v1.MakeBucketResponse.
 * Use `create(MakeBucketResponseSchema)` to create a new message.
 */
export declare const MakeBucketResponseSchema: GenMessage<MakeBucketResponse>;

/**
 * @generated from message wode.storage.object.v1.ListObjectRequest
 */
export declare type ListObjectRequest = Message<"wode.storage.object.v1.ListObjectRequest"> & {
  /**
   * @generated from field: string bucket = 1;
   */
  bucket: string;

  /**
   * @generated from field: string prefix = 2;
   */
  prefix: string;

  /**
   * @generated from field: bool recursive = 3;
   */
  recursive: boolean;

  /**
   * @generated from field: string start_after = 4;
   */
  startAfter: string;

  /**
   * @generated from field: bool include_meta = 5;
   */
  includeMeta: boolean;
};

/**
 * Describes the message wode.storage.object.v1.ListObjectRequest.
 * Use `create(ListObjectRequestSchema)` to create a new message.
 */
export declare const ListObjectRequestSchema: GenMessage<ListObjectRequest>;

/**
 * @generated from message wode.storage.object.v1.ListObjectResponse
 */
export declare type ListObjectResponse = Message<"wode.storage.object.v1.ListObjectResponse"> & {
  /**
   * @generated from field: repeated wode.storage.object.v1.ObjectMeta data = 1;
   */
  data: ObjectMeta[];
};

/**
 * Describes the message wode.storage.object.v1.ListObjectResponse.
 * Use `create(ListObjectResponseSchema)` to create a new message.
 */
export declare const ListObjectResponseSchema: GenMessage<ListObjectResponse>;

/**
 * @generated from message wode.storage.object.v1.GetObjectRequest
 */
export declare type GetObjectRequest = Message<"wode.storage.object.v1.GetObjectRequest"> & {
  /**
   * @generated from field: wode.storage.object.v1.ObjectRef ref = 1;
   */
  ref?: ObjectRef;
};

/**
 * Describes the message wode.storage.object.v1.GetObjectRequest.
 * Use `create(GetObjectRequestSchema)` to create a new message.
 */
export declare const GetObjectRequestSchema: GenMessage<GetObjectRequest>;

/**
 * @generated from message wode.storage.object.v1.GetObjectResponse
 */
export declare type GetObjectResponse = Message<"wode.storage.object.v1.GetObjectResponse"> & {
  /**
   * @generated from field: bytes data = 1;
   */
  data: Uint8Array;
};

/**
 * Describes the message wode.storage.object.v1.GetObjectResponse.
 * Use `create(GetObjectResponseSchema)` to create a new message.
 */
export declare const GetObjectResponseSchema: GenMessage<GetObjectResponse>;

/**
 * @generated from message wode.storage.object.v1.GetObjectStreamRequest
 */
export declare type GetObjectStreamRequest = Message<"wode.storage.object.v1.GetObjectStreamRequest"> & {
  /**
   * @generated from field: wode.storage.object.v1.ObjectRef ref = 1;
   */
  ref?: ObjectRef;

  /**
   * @generated from field: int64 offset = 2;
   */
  offset: bigint;

  /**
   * @generated from field: int64 length = 3;
   */
  length: bigint;
};

/**
 * Describes the message wode.storage.object.v1.GetObjectStreamRequest.
 * Use `create(GetObjectStreamRequestSchema)` to create a new message.
 */
export declare const GetObjectStreamRequestSchema: GenMessage<GetObjectStreamRequest>;

/**
 * @generated from message wode.storage.object.v1.GetObjectStreamResponse
 */
export declare type GetObjectStreamResponse = Message<"wode.storage.object.v1.GetObjectStreamResponse"> & {
  /**
   * @generated from field: bytes data = 1;
   */
  data: Uint8Array;
};

/**
 * Describes the message wode.storage.object.v1.GetObjectStreamResponse.
 * Use `create(GetObjectStreamResponseSchema)` to create a new message.
 */
export declare const GetObjectStreamResponseSchema: GenMessage<GetObjectStreamResponse>;

/**
 * @generated from message wode.storage.object.v1.PutObjectRequest
 */
export declare type PutObjectRequest = Message<"wode.storage.object.v1.PutObjectRequest"> & {
  /**
   * @generated from field: wode.storage.object.v1.ObjectRef ref = 1;
   */
  ref?: ObjectRef;

  /**
   * @generated from field: bytes data = 2;
   */
  data: Uint8Array;
};

/**
 * Describes the message wode.storage.object.v1.PutObjectRequest.
 * Use `create(PutObjectRequestSchema)` to create a new message.
 */
export declare const PutObjectRequestSchema: GenMessage<PutObjectRequest>;

/**
 * @generated from message wode.storage.object.v1.PutObjectResponse
 */
export declare type PutObjectResponse = Message<"wode.storage.object.v1.PutObjectResponse"> & {
};

/**
 * Describes the message wode.storage.object.v1.PutObjectResponse.
 * Use `create(PutObjectResponseSchema)` to create a new message.
 */
export declare const PutObjectResponseSchema: GenMessage<PutObjectResponse>;

/**
 * @generated from message wode.storage.object.v1.PutObjectStreamRequest
 */
export declare type PutObjectStreamRequest = Message<"wode.storage.object.v1.PutObjectStreamRequest"> & {
  /**
   * @generated from field: wode.storage.object.v1.ObjectRef ref = 1;
   */
  ref?: ObjectRef;

  /**
   * @generated from field: int64 offset = 2;
   */
  offset: bigint;

  /**
   * @generated from field: bytes data = 3;
   */
  data: Uint8Array;
};

/**
 * Describes the message wode.storage.object.v1.PutObjectStreamRequest.
 * Use `create(PutObjectStreamRequestSchema)` to create a new message.
 */
export declare const PutObjectStreamRequestSchema: GenMessage<PutObjectStreamRequest>;

/**
 * @generated from message wode.storage.object.v1.PutObjectStreamResponse
 */
export declare type PutObjectStreamResponse = Message<"wode.storage.object.v1.PutObjectStreamResponse"> & {
};

/**
 * Describes the message wode.storage.object.v1.PutObjectStreamResponse.
 * Use `create(PutObjectStreamResponseSchema)` to create a new message.
 */
export declare const PutObjectStreamResponseSchema: GenMessage<PutObjectStreamResponse>;

/**
 * @generated from message wode.storage.object.v1.ComposeObjectRequest
 */
export declare type ComposeObjectRequest = Message<"wode.storage.object.v1.ComposeObjectRequest"> & {
  /**
   * @generated from field: repeated wode.storage.object.v1.ObjectRef refs = 1;
   */
  refs: ObjectRef[];

  /**
   * @generated from field: wode.storage.object.v1.ObjectRef target = 2;
   */
  target?: ObjectRef;
};

/**
 * Describes the message wode.storage.object.v1.ComposeObjectRequest.
 * Use `create(ComposeObjectRequestSchema)` to create a new message.
 */
export declare const ComposeObjectRequestSchema: GenMessage<ComposeObjectRequest>;

/**
 * @generated from message wode.storage.object.v1.ComposeObjectResponse
 */
export declare type ComposeObjectResponse = Message<"wode.storage.object.v1.ComposeObjectResponse"> & {
};

/**
 * Describes the message wode.storage.object.v1.ComposeObjectResponse.
 * Use `create(ComposeObjectResponseSchema)` to create a new message.
 */
export declare const ComposeObjectResponseSchema: GenMessage<ComposeObjectResponse>;

/**
 * @generated from message wode.storage.object.v1.CopyObjectRequest
 */
export declare type CopyObjectRequest = Message<"wode.storage.object.v1.CopyObjectRequest"> & {
  /**
   * @generated from field: wode.storage.object.v1.ObjectRef source = 1;
   */
  source?: ObjectRef;

  /**
   * @generated from field: wode.storage.object.v1.ObjectRef target = 2;
   */
  target?: ObjectRef;
};

/**
 * Describes the message wode.storage.object.v1.CopyObjectRequest.
 * Use `create(CopyObjectRequestSchema)` to create a new message.
 */
export declare const CopyObjectRequestSchema: GenMessage<CopyObjectRequest>;

/**
 * @generated from message wode.storage.object.v1.CopyObjectResponse
 */
export declare type CopyObjectResponse = Message<"wode.storage.object.v1.CopyObjectResponse"> & {
};

/**
 * Describes the message wode.storage.object.v1.CopyObjectResponse.
 * Use `create(CopyObjectResponseSchema)` to create a new message.
 */
export declare const CopyObjectResponseSchema: GenMessage<CopyObjectResponse>;

/**
 * @generated from message wode.storage.object.v1.StatObjectRequest
 */
export declare type StatObjectRequest = Message<"wode.storage.object.v1.StatObjectRequest"> & {
  /**
   * @generated from field: wode.storage.object.v1.ObjectRef ref = 1;
   */
  ref?: ObjectRef;
};

/**
 * Describes the message wode.storage.object.v1.StatObjectRequest.
 * Use `create(StatObjectRequestSchema)` to create a new message.
 */
export declare const StatObjectRequestSchema: GenMessage<StatObjectRequest>;

/**
 * @generated from message wode.storage.object.v1.StatObjectResponse
 */
export declare type StatObjectResponse = Message<"wode.storage.object.v1.StatObjectResponse"> & {
  /**
   * @generated from field: wode.storage.object.v1.ObjectMeta meta = 1;
   */
  meta?: ObjectMeta;
};

/**
 * Describes the message wode.storage.object.v1.StatObjectResponse.
 * Use `create(StatObjectResponseSchema)` to create a new message.
 */
export declare const StatObjectResponseSchema: GenMessage<StatObjectResponse>;

/**
 * @generated from message wode.storage.object.v1.RemoveObjectRequest
 */
export declare type RemoveObjectRequest = Message<"wode.storage.object.v1.RemoveObjectRequest"> & {
  /**
   * @generated from field: wode.storage.object.v1.ObjectRef ref = 1;
   */
  ref?: ObjectRef;
};

/**
 * Describes the message wode.storage.object.v1.RemoveObjectRequest.
 * Use `create(RemoveObjectRequestSchema)` to create a new message.
 */
export declare const RemoveObjectRequestSchema: GenMessage<RemoveObjectRequest>;

/**
 * @generated from message wode.storage.object.v1.RemoveObjectResponse
 */
export declare type RemoveObjectResponse = Message<"wode.storage.object.v1.RemoveObjectResponse"> & {
};

/**
 * Describes the message wode.storage.object.v1.RemoveObjectResponse.
 * Use `create(RemoveObjectResponseSchema)` to create a new message.
 */
export declare const RemoveObjectResponseSchema: GenMessage<RemoveObjectResponse>;

/**
 * @generated from service wode.storage.object.v1.ObjectStorageService
 */
export declare const ObjectStorageService: GenService<{
  /**
   * @generated from rpc wode.storage.object.v1.ObjectStorageService.ListBucket
   */
  listBucket: {
    methodKind: "unary";
    input: typeof ListBucketRequestSchema;
    output: typeof ListBucketResponseSchema;
  },
  /**
   * @generated from rpc wode.storage.object.v1.ObjectStorageService.MakeBucket
   */
  makeBucket: {
    methodKind: "unary";
    input: typeof MakeBucketRequestSchema;
    output: typeof MakeBucketResponseSchema;
  },
  /**
   * @generated from rpc wode.storage.object.v1.ObjectStorageService.GetObject
   */
  getObject: {
    methodKind: "unary";
    input: typeof GetObjectRequestSchema;
    output: typeof GetObjectResponseSchema;
  },
  /**
   * @generated from rpc wode.storage.object.v1.ObjectStorageService.GetObjectStream
   */
  getObjectStream: {
    methodKind: "server_streaming";
    input: typeof GetObjectStreamRequestSchema;
    output: typeof GetObjectStreamResponseSchema;
  },
  /**
   * @generated from rpc wode.storage.object.v1.ObjectStorageService.ListObject
   */
  listObject: {
    methodKind: "unary";
    input: typeof ListObjectRequestSchema;
    output: typeof ListObjectResponseSchema;
  },
  /**
   * @generated from rpc wode.storage.object.v1.ObjectStorageService.PutObject
   */
  putObject: {
    methodKind: "unary";
    input: typeof PutObjectRequestSchema;
    output: typeof PutObjectResponseSchema;
  },
  /**
   * @generated from rpc wode.storage.object.v1.ObjectStorageService.PutObjectStream
   */
  putObjectStream: {
    methodKind: "client_streaming";
    input: typeof PutObjectStreamRequestSchema;
    output: typeof PutObjectStreamResponseSchema;
  },
  /**
   * @generated from rpc wode.storage.object.v1.ObjectStorageService.ComposeObject
   */
  composeObject: {
    methodKind: "unary";
    input: typeof ComposeObjectRequestSchema;
    output: typeof ComposeObjectResponseSchema;
  },
  /**
   * @generated from rpc wode.storage.object.v1.ObjectStorageService.CopyObject
   */
  copyObject: {
    methodKind: "unary";
    input: typeof CopyObjectRequestSchema;
    output: typeof CopyObjectResponseSchema;
  },
  /**
   * @generated from rpc wode.storage.object.v1.ObjectStorageService.StatObject
   */
  statObject: {
    methodKind: "unary";
    input: typeof StatObjectRequestSchema;
    output: typeof StatObjectResponseSchema;
  },
  /**
   * @generated from rpc wode.storage.object.v1.ObjectStorageService.RemoveObject
   */
  removeObject: {
    methodKind: "unary";
    input: typeof RemoveObjectRequestSchema;
    output: typeof RemoveObjectResponseSchema;
  },
}>;

