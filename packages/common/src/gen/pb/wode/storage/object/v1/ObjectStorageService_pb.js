// @generated by protoc-gen-es v2.2.2
// @generated from file wode/storage/object/v1/ObjectStorageService.proto (package wode.storage.object.v1, syntax proto3)
/* eslint-disable */

import { fileDesc, messageDesc, serviceDesc } from "@bufbuild/protobuf/codegenv1";
import { file_google_protobuf_timestamp } from "@bufbuild/protobuf/wkt";

/**
 * Describes the file wode/storage/object/v1/ObjectStorageService.proto.
 */
export const file_wode_storage_object_v1_ObjectStorageService = /*@__PURE__*/
  fileDesc("CjF3b2RlL3N0b3JhZ2Uvb2JqZWN0L3YxL09iamVjdFN0b3JhZ2VTZXJ2aWNlLnByb3RvEhZ3b2RlLnN0b3JhZ2Uub2JqZWN0LnYxIikKCU9iamVjdFJlZhIOCgZidWNrZXQYASABKAkSDAoEbmFtZRgCIAEoCSKvAgoKT2JqZWN0TWV0YRIMCgRuYW1lGAEgASgJEg4KBnByZWZpeBgCIAEoCRIMCgRzaXplGAMgASgDEgwKBGV0YWcYBCABKAkSLgoFY3RpbWUYBiABKAsyGi5nb29nbGUucHJvdG9idWYuVGltZXN0YW1wSACIAQESLgoFbXRpbWUYByABKAsyGi5nb29nbGUucHJvdG9idWYuVGltZXN0YW1wSAGIAQESQgoIbWV0YWRhdGEYCCADKAsyMC53b2RlLnN0b3JhZ2Uub2JqZWN0LnYxLk9iamVjdE1ldGEuTWV0YWRhdGFFbnRyeRovCg1NZXRhZGF0YUVudHJ5EgsKA2tleRgBIAEoCRINCgV2YWx1ZRgCIAEoCToCOAFCCAoGX2N0aW1lQggKBl9tdGltZSJKCgpCdWNrZXRNZXRhEgwKBG5hbWUYASABKAkSLgoKY3JlYXRlZF9hdBgCIAEoCzIaLmdvb2dsZS5wcm90b2J1Zi5UaW1lc3RhbXAiEwoRTGlzdEJ1Y2tldFJlcXVlc3QiRgoSTGlzdEJ1Y2tldFJlc3BvbnNlEjAKBGRhdGEYASADKAsyIi53b2RlLnN0b3JhZ2Uub2JqZWN0LnYxLkJ1Y2tldE1ldGEiIQoRTWFrZUJ1Y2tldFJlcXVlc3QSDAoEbmFtZRgBIAEoCSJGChJNYWtlQnVja2V0UmVzcG9uc2USMAoEZGF0YRgBIAEoCzIiLndvZGUuc3RvcmFnZS5vYmplY3QudjEuQnVja2V0TWV0YSJxChFMaXN0T2JqZWN0UmVxdWVzdBIOCgZidWNrZXQYASABKAkSDgoGcHJlZml4GAIgASgJEhEKCXJlY3Vyc2l2ZRgDIAEoCBITCgtzdGFydF9hZnRlchgEIAEoCRIUCgxpbmNsdWRlX21ldGEYBSABKAgiRgoSTGlzdE9iamVjdFJlc3BvbnNlEjAKBGRhdGEYASADKAsyIi53b2RlLnN0b3JhZ2Uub2JqZWN0LnYxLk9iamVjdE1ldGEiQgoQR2V0T2JqZWN0UmVxdWVzdBIuCgNyZWYYASABKAsyIS53b2RlLnN0b3JhZ2Uub2JqZWN0LnYxLk9iamVjdFJlZiIhChFHZXRPYmplY3RSZXNwb25zZRIMCgRkYXRhGAEgASgMImgKFkdldE9iamVjdFN0cmVhbVJlcXVlc3QSLgoDcmVmGAEgASgLMiEud29kZS5zdG9yYWdlLm9iamVjdC52MS5PYmplY3RSZWYSDgoGb2Zmc2V0GAIgASgDEg4KBmxlbmd0aBgDIAEoAyInChdHZXRPYmplY3RTdHJlYW1SZXNwb25zZRIMCgRkYXRhGAEgASgMIlAKEFB1dE9iamVjdFJlcXVlc3QSLgoDcmVmGAEgASgLMiEud29kZS5zdG9yYWdlLm9iamVjdC52MS5PYmplY3RSZWYSDAoEZGF0YRgCIAEoDCITChFQdXRPYmplY3RSZXNwb25zZSJmChZQdXRPYmplY3RTdHJlYW1SZXF1ZXN0Ei4KA3JlZhgBIAEoCzIhLndvZGUuc3RvcmFnZS5vYmplY3QudjEuT2JqZWN0UmVmEg4KBm9mZnNldBgCIAEoAxIMCgRkYXRhGAMgASgMIhkKF1B1dE9iamVjdFN0cmVhbVJlc3BvbnNlInoKFENvbXBvc2VPYmplY3RSZXF1ZXN0Ei8KBHJlZnMYASADKAsyIS53b2RlLnN0b3JhZ2Uub2JqZWN0LnYxLk9iamVjdFJlZhIxCgZ0YXJnZXQYAiABKAsyIS53b2RlLnN0b3JhZ2Uub2JqZWN0LnYxLk9iamVjdFJlZiIXChVDb21wb3NlT2JqZWN0UmVzcG9uc2UieQoRQ29weU9iamVjdFJlcXVlc3QSMQoGc291cmNlGAEgASgLMiEud29kZS5zdG9yYWdlLm9iamVjdC52MS5PYmplY3RSZWYSMQoGdGFyZ2V0GAIgASgLMiEud29kZS5zdG9yYWdlLm9iamVjdC52MS5PYmplY3RSZWYiFAoSQ29weU9iamVjdFJlc3BvbnNlIkMKEVN0YXRPYmplY3RSZXF1ZXN0Ei4KA3JlZhgBIAEoCzIhLndvZGUuc3RvcmFnZS5vYmplY3QudjEuT2JqZWN0UmVmIkYKElN0YXRPYmplY3RSZXNwb25zZRIwCgRtZXRhGAEgASgLMiIud29kZS5zdG9yYWdlLm9iamVjdC52MS5PYmplY3RNZXRhIkUKE1JlbW92ZU9iamVjdFJlcXVlc3QSLgoDcmVmGAEgASgLMiEud29kZS5zdG9yYWdlLm9iamVjdC52MS5PYmplY3RSZWYiFgoUUmVtb3ZlT2JqZWN0UmVzcG9uc2UymAkKFE9iamVjdFN0b3JhZ2VTZXJ2aWNlEmMKCkxpc3RCdWNrZXQSKS53b2RlLnN0b3JhZ2Uub2JqZWN0LnYxLkxpc3RCdWNrZXRSZXF1ZXN0Gioud29kZS5zdG9yYWdlLm9iamVjdC52MS5MaXN0QnVja2V0UmVzcG9uc2USYwoKTWFrZUJ1Y2tldBIpLndvZGUuc3RvcmFnZS5vYmplY3QudjEuTWFrZUJ1Y2tldFJlcXVlc3QaKi53b2RlLnN0b3JhZ2Uub2JqZWN0LnYxLk1ha2VCdWNrZXRSZXNwb25zZRJgCglHZXRPYmplY3QSKC53b2RlLnN0b3JhZ2Uub2JqZWN0LnYxLkdldE9iamVjdFJlcXVlc3QaKS53b2RlLnN0b3JhZ2Uub2JqZWN0LnYxLkdldE9iamVjdFJlc3BvbnNlEnQKD0dldE9iamVjdFN0cmVhbRIuLndvZGUuc3RvcmFnZS5vYmplY3QudjEuR2V0T2JqZWN0U3RyZWFtUmVxdWVzdBovLndvZGUuc3RvcmFnZS5vYmplY3QudjEuR2V0T2JqZWN0U3RyZWFtUmVzcG9uc2UwARJjCgpMaXN0T2JqZWN0Eikud29kZS5zdG9yYWdlLm9iamVjdC52MS5MaXN0T2JqZWN0UmVxdWVzdBoqLndvZGUuc3RvcmFnZS5vYmplY3QudjEuTGlzdE9iamVjdFJlc3BvbnNlEmAKCVB1dE9iamVjdBIoLndvZGUuc3RvcmFnZS5vYmplY3QudjEuUHV0T2JqZWN0UmVxdWVzdBopLndvZGUuc3RvcmFnZS5vYmplY3QudjEuUHV0T2JqZWN0UmVzcG9uc2USdAoPUHV0T2JqZWN0U3RyZWFtEi4ud29kZS5zdG9yYWdlLm9iamVjdC52MS5QdXRPYmplY3RTdHJlYW1SZXF1ZXN0Gi8ud29kZS5zdG9yYWdlLm9iamVjdC52MS5QdXRPYmplY3RTdHJlYW1SZXNwb25zZSgBEmwKDUNvbXBvc2VPYmplY3QSLC53b2RlLnN0b3JhZ2Uub2JqZWN0LnYxLkNvbXBvc2VPYmplY3RSZXF1ZXN0Gi0ud29kZS5zdG9yYWdlLm9iamVjdC52MS5Db21wb3NlT2JqZWN0UmVzcG9uc2USYwoKQ29weU9iamVjdBIpLndvZGUuc3RvcmFnZS5vYmplY3QudjEuQ29weU9iamVjdFJlcXVlc3QaKi53b2RlLnN0b3JhZ2Uub2JqZWN0LnYxLkNvcHlPYmplY3RSZXNwb25zZRJjCgpTdGF0T2JqZWN0Eikud29kZS5zdG9yYWdlLm9iamVjdC52MS5TdGF0T2JqZWN0UmVxdWVzdBoqLndvZGUuc3RvcmFnZS5vYmplY3QudjEuU3RhdE9iamVjdFJlc3BvbnNlEmkKDFJlbW92ZU9iamVjdBIrLndvZGUuc3RvcmFnZS5vYmplY3QudjEuUmVtb3ZlT2JqZWN0UmVxdWVzdBosLndvZGUuc3RvcmFnZS5vYmplY3QudjEuUmVtb3ZlT2JqZWN0UmVzcG9uc2ViBnByb3RvMw", [file_google_protobuf_timestamp]);

/**
 * Describes the message wode.storage.object.v1.ObjectRef.
 * Use `create(ObjectRefSchema)` to create a new message.
 */
export const ObjectRefSchema = /*@__PURE__*/
  messageDesc(file_wode_storage_object_v1_ObjectStorageService, 0);

/**
 * Describes the message wode.storage.object.v1.ObjectMeta.
 * Use `create(ObjectMetaSchema)` to create a new message.
 */
export const ObjectMetaSchema = /*@__PURE__*/
  messageDesc(file_wode_storage_object_v1_ObjectStorageService, 1);

/**
 * Describes the message wode.storage.object.v1.BucketMeta.
 * Use `create(BucketMetaSchema)` to create a new message.
 */
export const BucketMetaSchema = /*@__PURE__*/
  messageDesc(file_wode_storage_object_v1_ObjectStorageService, 2);

/**
 * Describes the message wode.storage.object.v1.ListBucketRequest.
 * Use `create(ListBucketRequestSchema)` to create a new message.
 */
export const ListBucketRequestSchema = /*@__PURE__*/
  messageDesc(file_wode_storage_object_v1_ObjectStorageService, 3);

/**
 * Describes the message wode.storage.object.v1.ListBucketResponse.
 * Use `create(ListBucketResponseSchema)` to create a new message.
 */
export const ListBucketResponseSchema = /*@__PURE__*/
  messageDesc(file_wode_storage_object_v1_ObjectStorageService, 4);

/**
 * Describes the message wode.storage.object.v1.MakeBucketRequest.
 * Use `create(MakeBucketRequestSchema)` to create a new message.
 */
export const MakeBucketRequestSchema = /*@__PURE__*/
  messageDesc(file_wode_storage_object_v1_ObjectStorageService, 5);

/**
 * Describes the message wode.storage.object.v1.MakeBucketResponse.
 * Use `create(MakeBucketResponseSchema)` to create a new message.
 */
export const MakeBucketResponseSchema = /*@__PURE__*/
  messageDesc(file_wode_storage_object_v1_ObjectStorageService, 6);

/**
 * Describes the message wode.storage.object.v1.ListObjectRequest.
 * Use `create(ListObjectRequestSchema)` to create a new message.
 */
export const ListObjectRequestSchema = /*@__PURE__*/
  messageDesc(file_wode_storage_object_v1_ObjectStorageService, 7);

/**
 * Describes the message wode.storage.object.v1.ListObjectResponse.
 * Use `create(ListObjectResponseSchema)` to create a new message.
 */
export const ListObjectResponseSchema = /*@__PURE__*/
  messageDesc(file_wode_storage_object_v1_ObjectStorageService, 8);

/**
 * Describes the message wode.storage.object.v1.GetObjectRequest.
 * Use `create(GetObjectRequestSchema)` to create a new message.
 */
export const GetObjectRequestSchema = /*@__PURE__*/
  messageDesc(file_wode_storage_object_v1_ObjectStorageService, 9);

/**
 * Describes the message wode.storage.object.v1.GetObjectResponse.
 * Use `create(GetObjectResponseSchema)` to create a new message.
 */
export const GetObjectResponseSchema = /*@__PURE__*/
  messageDesc(file_wode_storage_object_v1_ObjectStorageService, 10);

/**
 * Describes the message wode.storage.object.v1.GetObjectStreamRequest.
 * Use `create(GetObjectStreamRequestSchema)` to create a new message.
 */
export const GetObjectStreamRequestSchema = /*@__PURE__*/
  messageDesc(file_wode_storage_object_v1_ObjectStorageService, 11);

/**
 * Describes the message wode.storage.object.v1.GetObjectStreamResponse.
 * Use `create(GetObjectStreamResponseSchema)` to create a new message.
 */
export const GetObjectStreamResponseSchema = /*@__PURE__*/
  messageDesc(file_wode_storage_object_v1_ObjectStorageService, 12);

/**
 * Describes the message wode.storage.object.v1.PutObjectRequest.
 * Use `create(PutObjectRequestSchema)` to create a new message.
 */
export const PutObjectRequestSchema = /*@__PURE__*/
  messageDesc(file_wode_storage_object_v1_ObjectStorageService, 13);

/**
 * Describes the message wode.storage.object.v1.PutObjectResponse.
 * Use `create(PutObjectResponseSchema)` to create a new message.
 */
export const PutObjectResponseSchema = /*@__PURE__*/
  messageDesc(file_wode_storage_object_v1_ObjectStorageService, 14);

/**
 * Describes the message wode.storage.object.v1.PutObjectStreamRequest.
 * Use `create(PutObjectStreamRequestSchema)` to create a new message.
 */
export const PutObjectStreamRequestSchema = /*@__PURE__*/
  messageDesc(file_wode_storage_object_v1_ObjectStorageService, 15);

/**
 * Describes the message wode.storage.object.v1.PutObjectStreamResponse.
 * Use `create(PutObjectStreamResponseSchema)` to create a new message.
 */
export const PutObjectStreamResponseSchema = /*@__PURE__*/
  messageDesc(file_wode_storage_object_v1_ObjectStorageService, 16);

/**
 * Describes the message wode.storage.object.v1.ComposeObjectRequest.
 * Use `create(ComposeObjectRequestSchema)` to create a new message.
 */
export const ComposeObjectRequestSchema = /*@__PURE__*/
  messageDesc(file_wode_storage_object_v1_ObjectStorageService, 17);

/**
 * Describes the message wode.storage.object.v1.ComposeObjectResponse.
 * Use `create(ComposeObjectResponseSchema)` to create a new message.
 */
export const ComposeObjectResponseSchema = /*@__PURE__*/
  messageDesc(file_wode_storage_object_v1_ObjectStorageService, 18);

/**
 * Describes the message wode.storage.object.v1.CopyObjectRequest.
 * Use `create(CopyObjectRequestSchema)` to create a new message.
 */
export const CopyObjectRequestSchema = /*@__PURE__*/
  messageDesc(file_wode_storage_object_v1_ObjectStorageService, 19);

/**
 * Describes the message wode.storage.object.v1.CopyObjectResponse.
 * Use `create(CopyObjectResponseSchema)` to create a new message.
 */
export const CopyObjectResponseSchema = /*@__PURE__*/
  messageDesc(file_wode_storage_object_v1_ObjectStorageService, 20);

/**
 * Describes the message wode.storage.object.v1.StatObjectRequest.
 * Use `create(StatObjectRequestSchema)` to create a new message.
 */
export const StatObjectRequestSchema = /*@__PURE__*/
  messageDesc(file_wode_storage_object_v1_ObjectStorageService, 21);

/**
 * Describes the message wode.storage.object.v1.StatObjectResponse.
 * Use `create(StatObjectResponseSchema)` to create a new message.
 */
export const StatObjectResponseSchema = /*@__PURE__*/
  messageDesc(file_wode_storage_object_v1_ObjectStorageService, 22);

/**
 * Describes the message wode.storage.object.v1.RemoveObjectRequest.
 * Use `create(RemoveObjectRequestSchema)` to create a new message.
 */
export const RemoveObjectRequestSchema = /*@__PURE__*/
  messageDesc(file_wode_storage_object_v1_ObjectStorageService, 23);

/**
 * Describes the message wode.storage.object.v1.RemoveObjectResponse.
 * Use `create(RemoveObjectResponseSchema)` to create a new message.
 */
export const RemoveObjectResponseSchema = /*@__PURE__*/
  messageDesc(file_wode_storage_object_v1_ObjectStorageService, 24);

/**
 * @generated from service wode.storage.object.v1.ObjectStorageService
 */
export const ObjectStorageService = /*@__PURE__*/
  serviceDesc(file_wode_storage_object_v1_ObjectStorageService, 0);
