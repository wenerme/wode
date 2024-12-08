// @generated by protoc-gen-es v2.2.1
// @generated from file wener/wode/storage/bin/v1/BinStorageService.proto (package wener.wode.storage.bin.v1, syntax proto3)
/* eslint-disable */

import { fileDesc, messageDesc, serviceDesc } from "@bufbuild/protobuf/codegenv1";
import { file_google_protobuf_timestamp } from "@bufbuild/protobuf/wkt";
import { file_wener_wode_common_v1_ListQuery } from "../../../common/v1/ListQuery_pb";

/**
 * Describes the file wener/wode/storage/bin/v1/BinStorageService.proto.
 */
export const file_wener_wode_storage_bin_v1_BinStorageService = /*@__PURE__*/
  fileDesc("CjF3ZW5lci93b2RlL3N0b3JhZ2UvYmluL3YxL0JpblN0b3JhZ2VTZXJ2aWNlLnByb3RvEhl3ZW5lci53b2RlLnN0b3JhZ2UuYmluLnYxIr4CCgdCaW5NZXRhEgsKA2tleRgBIAEoCRISCgV0aXRsZRgCIAEoCUgAiAEBEhkKDGNvbnRlbnRfdHlwZRgDIAEoCUgBiAEBEh0KEGNvbnRlbnRfZW5jb2RpbmcYBCABKAlIAogBARIvCgtjcmVhdGVfdGltZRgFIAEoCzIaLmdvb2dsZS5wcm90b2J1Zi5UaW1lc3RhbXASNAoLZXhwaXJlX3RpbWUYBiABKAsyGi5nb29nbGUucHJvdG9idWYuVGltZXN0YW1wSAOIAQESDAoEc2l6ZRgHIAEoAxILCgN0dGwYCCABKAMSFgoOZW5jcnlwdF9tZXRob2QYCSABKAlCCAoGX3RpdGxlQg8KDV9jb250ZW50X3R5cGVCEwoRX2NvbnRlbnRfZW5jb2RpbmdCDgoMX2V4cGlyZV90aW1lIngKClB1dFJlcXVlc3QSCwoDa2V5GAEgASgJEjAKBG1ldGEYAiABKAsyIi53ZW5lci53b2RlLnN0b3JhZ2UuYmluLnYxLkJpbk1ldGESDgoEdGV4dBgDIAEoCUgAEhAKBmJpbmFyeRgEIAEoDEgAQgkKB2NvbnRlbnQiGgoLUHV0UmVzcG9uc2USCwoDa2V5GAEgASgJIjIKCkdldFJlcXVlc3QSCwoDa2V5GAEgASgJEhcKD2luY2x1ZGVfY29udGVudBgCIAEoCCJsCgtHZXRSZXNwb25zZRIwCgRtZXRhGAEgASgLMiIud2VuZXIud29kZS5zdG9yYWdlLmJpbi52MS5CaW5NZXRhEg4KBHRleHQYAiABKAlIABIQCgZiaW5hcnkYAyABKAxIAEIJCgdjb250ZW50Ij0KC0xpc3RSZXF1ZXN0Ei4KBXF1ZXJ5GAEgASgLMh8ud2VuZXIud29kZS5jb21tb24udjEuTGlzdFF1ZXJ5IlkKDExpc3RSZXNwb25zZRIwCgRkYXRhGAEgAygLMiIud2VuZXIud29kZS5zdG9yYWdlLmJpbi52MS5CaW5NZXRhEhcKD25leHRfcGFnZV90b2tlbhgCIAEoCSIcCg1EZWxldGVSZXF1ZXN0EgsKA2tleRgBIAEoCSIyCg5EZWxldGVSZXNwb25zZRIPCgdzdWNjZXNzGAEgASgIEg8KB21lc3NhZ2UYAiABKAky9AIKDldvZGVCaW5TZXJ2aWNlElQKA1B1dBIlLndlbmVyLndvZGUuc3RvcmFnZS5iaW4udjEuUHV0UmVxdWVzdBomLndlbmVyLndvZGUuc3RvcmFnZS5iaW4udjEuUHV0UmVzcG9uc2USVAoDR2V0EiUud2VuZXIud29kZS5zdG9yYWdlLmJpbi52MS5HZXRSZXF1ZXN0GiYud2VuZXIud29kZS5zdG9yYWdlLmJpbi52MS5HZXRSZXNwb25zZRJdCgZEZWxldGUSKC53ZW5lci53b2RlLnN0b3JhZ2UuYmluLnYxLkRlbGV0ZVJlcXVlc3QaKS53ZW5lci53b2RlLnN0b3JhZ2UuYmluLnYxLkRlbGV0ZVJlc3BvbnNlElcKBExpc3QSJi53ZW5lci53b2RlLnN0b3JhZ2UuYmluLnYxLkxpc3RSZXF1ZXN0Gicud2VuZXIud29kZS5zdG9yYWdlLmJpbi52MS5MaXN0UmVzcG9uc2ViBnByb3RvMw", [file_google_protobuf_timestamp, file_wener_wode_common_v1_ListQuery]);

/**
 * Describes the message wener.wode.storage.bin.v1.BinMeta.
 * Use `create(BinMetaSchema)` to create a new message.
 */
export const BinMetaSchema = /*@__PURE__*/
  messageDesc(file_wener_wode_storage_bin_v1_BinStorageService, 0);

/**
 * Describes the message wener.wode.storage.bin.v1.PutRequest.
 * Use `create(PutRequestSchema)` to create a new message.
 */
export const PutRequestSchema = /*@__PURE__*/
  messageDesc(file_wener_wode_storage_bin_v1_BinStorageService, 1);

/**
 * Describes the message wener.wode.storage.bin.v1.PutResponse.
 * Use `create(PutResponseSchema)` to create a new message.
 */
export const PutResponseSchema = /*@__PURE__*/
  messageDesc(file_wener_wode_storage_bin_v1_BinStorageService, 2);

/**
 * Describes the message wener.wode.storage.bin.v1.GetRequest.
 * Use `create(GetRequestSchema)` to create a new message.
 */
export const GetRequestSchema = /*@__PURE__*/
  messageDesc(file_wener_wode_storage_bin_v1_BinStorageService, 3);

/**
 * Describes the message wener.wode.storage.bin.v1.GetResponse.
 * Use `create(GetResponseSchema)` to create a new message.
 */
export const GetResponseSchema = /*@__PURE__*/
  messageDesc(file_wener_wode_storage_bin_v1_BinStorageService, 4);

/**
 * Describes the message wener.wode.storage.bin.v1.ListRequest.
 * Use `create(ListRequestSchema)` to create a new message.
 */
export const ListRequestSchema = /*@__PURE__*/
  messageDesc(file_wener_wode_storage_bin_v1_BinStorageService, 5);

/**
 * Describes the message wener.wode.storage.bin.v1.ListResponse.
 * Use `create(ListResponseSchema)` to create a new message.
 */
export const ListResponseSchema = /*@__PURE__*/
  messageDesc(file_wener_wode_storage_bin_v1_BinStorageService, 6);

/**
 * Describes the message wener.wode.storage.bin.v1.DeleteRequest.
 * Use `create(DeleteRequestSchema)` to create a new message.
 */
export const DeleteRequestSchema = /*@__PURE__*/
  messageDesc(file_wener_wode_storage_bin_v1_BinStorageService, 7);

/**
 * Describes the message wener.wode.storage.bin.v1.DeleteResponse.
 * Use `create(DeleteResponseSchema)` to create a new message.
 */
export const DeleteResponseSchema = /*@__PURE__*/
  messageDesc(file_wener_wode_storage_bin_v1_BinStorageService, 8);

/**
 * @generated from service wener.wode.storage.bin.v1.WodeBinService
 */
export const WodeBinService = /*@__PURE__*/
  serviceDesc(file_wener_wode_storage_bin_v1_BinStorageService, 0);

