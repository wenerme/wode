// @generated by protoc-gen-es v2.2.2
// @generated from file wode/resource/v1/Resource.proto (package wode.resource.v1, syntax proto3)
/* eslint-disable */

import { fileDesc, messageDesc, serviceDesc } from "@bufbuild/protobuf/codegenv1";
import { file_google_protobuf_struct, file_google_protobuf_timestamp } from "@bufbuild/protobuf/wkt";
import { file_wode_resource_v1_ListQuery } from "./ListQuery_pb";

/**
 * Describes the file wode/resource/v1/Resource.proto.
 */
export const file_wode_resource_v1_Resource = /*@__PURE__*/
  fileDesc("Ch93b2RlL3Jlc291cmNlL3YxL1Jlc291cmNlLnByb3RvEhB3b2RlLnJlc291cmNlLnYxIp0HCg1SZXNvdXJjZVByb3RvEgoKAmlkGGQgASgJEhAKA3VpZBhlIAEoCUgAiAEBEhAKA3RpZBhmIAEoCUgBiAEBEhAKA3NpZBhnIAEoA0gCiAEBEhAKA2VpZBhoIAEoCUgDiAEBEhAKA2NpZBhpIAEoCUgEiAEBEhAKA3JpZBhqIAEoCUgFiAEBEjMKCmNyZWF0ZWRfYXQYayABKAsyGi5nb29nbGUucHJvdG9idWYuVGltZXN0YW1wSAaIAQESMwoKdXBkYXRlZF9hdBhsIAEoCzIaLmdvb2dsZS5wcm90b2J1Zi5UaW1lc3RhbXBIB4gBARIzCgpkZWxldGVkX2F0GG0gASgLMhouZ29vZ2xlLnByb3RvYnVmLlRpbWVzdGFtcEgIiAEBEjAKCmF0dHJpYnV0ZXMYbiABKAsyFy5nb29nbGUucHJvdG9idWYuU3RydWN0SAmIAQESMAoKcHJvcGVydGllcxhvIAEoCzIXLmdvb2dsZS5wcm90b2J1Zi5TdHJ1Y3RICogBARIwCgpleHRlbnNpb25zGHAgASgLMhcuZ29vZ2xlLnByb3RvYnVmLlN0cnVjdEgLiAEBEhIKBXN0YXRlGHggASgJSAyIAQESEwoGc3RhdHVzGHkgASgJSA2IAQESDAoEdGFncxh7IAMoCRISCgVub3Rlcxh8IAEoCUgOiAEBEi4KCG1ldGFkYXRhGH0gASgLMhcuZ29vZ2xlLnByb3RvYnVmLlN0cnVjdEgPiAEBEhYKCG93bmVyX2lkGIIBIAEoCUgQiAEBEhgKCm93bmVyX3R5cGUYgwEgASgJSBGIAQESHAoOb3duaW5nX3VzZXJfaWQYhAEgASgJSBKIAQESHAoOb3duaW5nX3RlYW1faWQYhQEgASgJSBOIAQFCBgoEX3VpZEIGCgRfdGlkQgYKBF9zaWRCBgoEX2VpZEIGCgRfY2lkQgYKBF9yaWRCDQoLX2NyZWF0ZWRfYXRCDQoLX3VwZGF0ZWRfYXRCDQoLX2RlbGV0ZWRfYXRCDQoLX2F0dHJpYnV0ZXNCDQoLX3Byb3BlcnRpZXNCDQoLX2V4dGVuc2lvbnNCCAoGX3N0YXRlQgkKB19zdGF0dXNCCAoGX25vdGVzQgsKCV9tZXRhZGF0YUILCglfb3duZXJfaWRCDQoLX293bmVyX3R5cGVCEQoPX293bmluZ191c2VyX2lkQhEKD19vd25pbmdfdGVhbV9pZCLEAQoJQ3ViZVF1ZXJ5EhAKCHJlc291cmNlGAEgASgJEhIKCmRpbWVuc2lvbnMYAiADKAkSEAoIbWVhc3VyZXMYAyADKAkSDgoGZmlsdGVyGAQgASgJEg8KB2ZpbHRlcnMYBSADKAkSDQoFbGltaXQYBiABKAUSDgoGb2Zmc2V0GAcgASgFEg0KBXRvdGFsGAggASgIEg0KBW9yZGVyGAkgAygJEg4KBnJvbGx1cBgKIAEoCBIRCglzZXBhcmF0b3IYCyABKAkiQgoURXhlY0N1YmVRdWVyeVJlcXVlc3QSKgoFcXVlcnkYASABKAsyGy53b2RlLnJlc291cmNlLnYxLkN1YmVRdWVyeSJ5ChVFeGVjQ3ViZVF1ZXJ5UmVzcG9uc2USJQoEZGF0YRgBIAMoCzIXLmdvb2dsZS5wcm90b2J1Zi5TdHJ1Y3QSDQoFdG90YWwYAiABKAUSKgoFcXVlcnkYAyABKAsyGy53b2RlLnJlc291cmNlLnYxLkN1YmVRdWVyeSIgChJHZXRSZXNvdXJjZVJlcXVlc3QSCgoCaWQYASABKAkiRAoTR2V0UmVzb3VyY2VSZXNwb25zZRItCgRkYXRhGAEgASgLMh8ud29kZS5yZXNvdXJjZS52MS5SZXNvdXJjZVByb3RvIkEKE0xpc3RSZXNvdXJjZVJlcXVlc3QSKgoFcXVlcnkYASABKAsyGy53b2RlLnJlc291cmNlLnYxLkxpc3RRdWVyeSJUChRMaXN0UmVzb3VyY2VSZXNwb25zZRItCgRkYXRhGAEgAygLMh8ud29kZS5yZXNvdXJjZS52MS5SZXNvdXJjZVByb3RvEg0KBXRvdGFsGAIgASgFMrQCCg9SZXNvdXJjZVNlcnZpY2USXAoLR2V0UmVzb3VyY2USJC53b2RlLnJlc291cmNlLnYxLkdldFJlc291cmNlUmVxdWVzdBolLndvZGUucmVzb3VyY2UudjEuR2V0UmVzb3VyY2VSZXNwb25zZSIAEl8KDExpc3RSZXNvdXJjZRIlLndvZGUucmVzb3VyY2UudjEuTGlzdFJlc291cmNlUmVxdWVzdBomLndvZGUucmVzb3VyY2UudjEuTGlzdFJlc291cmNlUmVzcG9uc2UiABJiCg1FeGVjQ3ViZVF1ZXJ5EiYud29kZS5yZXNvdXJjZS52MS5FeGVjQ3ViZVF1ZXJ5UmVxdWVzdBonLndvZGUucmVzb3VyY2UudjEuRXhlY0N1YmVRdWVyeVJlc3BvbnNlIgBiBnByb3RvMw", [file_google_protobuf_struct, file_google_protobuf_timestamp, file_wode_resource_v1_ListQuery]);

/**
 * Describes the message wode.resource.v1.ResourceProto.
 * Use `create(ResourceProtoSchema)` to create a new message.
 */
export const ResourceProtoSchema = /*@__PURE__*/
  messageDesc(file_wode_resource_v1_Resource, 0);

/**
 * Describes the message wode.resource.v1.CubeQuery.
 * Use `create(CubeQuerySchema)` to create a new message.
 */
export const CubeQuerySchema = /*@__PURE__*/
  messageDesc(file_wode_resource_v1_Resource, 1);

/**
 * Describes the message wode.resource.v1.ExecCubeQueryRequest.
 * Use `create(ExecCubeQueryRequestSchema)` to create a new message.
 */
export const ExecCubeQueryRequestSchema = /*@__PURE__*/
  messageDesc(file_wode_resource_v1_Resource, 2);

/**
 * Describes the message wode.resource.v1.ExecCubeQueryResponse.
 * Use `create(ExecCubeQueryResponseSchema)` to create a new message.
 */
export const ExecCubeQueryResponseSchema = /*@__PURE__*/
  messageDesc(file_wode_resource_v1_Resource, 3);

/**
 * Describes the message wode.resource.v1.GetResourceRequest.
 * Use `create(GetResourceRequestSchema)` to create a new message.
 */
export const GetResourceRequestSchema = /*@__PURE__*/
  messageDesc(file_wode_resource_v1_Resource, 4);

/**
 * Describes the message wode.resource.v1.GetResourceResponse.
 * Use `create(GetResourceResponseSchema)` to create a new message.
 */
export const GetResourceResponseSchema = /*@__PURE__*/
  messageDesc(file_wode_resource_v1_Resource, 5);

/**
 * Describes the message wode.resource.v1.ListResourceRequest.
 * Use `create(ListResourceRequestSchema)` to create a new message.
 */
export const ListResourceRequestSchema = /*@__PURE__*/
  messageDesc(file_wode_resource_v1_Resource, 6);

/**
 * Describes the message wode.resource.v1.ListResourceResponse.
 * Use `create(ListResourceResponseSchema)` to create a new message.
 */
export const ListResourceResponseSchema = /*@__PURE__*/
  messageDesc(file_wode_resource_v1_Resource, 7);

/**
 * @generated from service wode.resource.v1.ResourceService
 */
export const ResourceService = /*@__PURE__*/
  serviceDesc(file_wode_resource_v1_Resource, 0);

