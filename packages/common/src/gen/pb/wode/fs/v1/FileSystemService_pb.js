// @generated by protoc-gen-es v2.2.2
// @generated from file wode/fs/v1/FileSystemService.proto (package wode.fs.v1, syntax proto3)
/* eslint-disable */

import { enumDesc, fileDesc, messageDesc, serviceDesc, tsEnum } from "@bufbuild/protobuf/codegenv1";
import { file_google_protobuf_timestamp } from "@bufbuild/protobuf/wkt";

/**
 * Describes the file wode/fs/v1/FileSystemService.proto.
 */
export const file_wode_fs_v1_FileSystemService = /*@__PURE__*/
  fileDesc("CiJ3b2RlL2ZzL3YxL0ZpbGVTeXN0ZW1TZXJ2aWNlLnByb3RvEgp3b2RlLmZzLnYxIjUKCFNob3J0Y3V0EgwKBHBhdGgYASABKAkSDAoEbmFtZRgCIAEoCRINCgVsYWJlbBgDIAEoCSIVChNMaXN0U2hvcnRjdXRSZXF1ZXN0IjoKFExpc3RTaG9ydGN1dFJlc3BvbnNlEiIKBGRhdGEYASADKAsyFC53b2RlLmZzLnYxLlNob3J0Y3V0IscBCg5GaWxlQXR0cmlidXRlcxIMCgRzaXplGAEgASgDEgwKBG1vZGUYAiABKA0SCwoDdWlkGAMgASgNEgsKA2dpZBgEIAEoDRIpCgVhdGltZRgFIAEoCzIaLmdvb2dsZS5wcm90b2J1Zi5UaW1lc3RhbXASKQoFbXRpbWUYBiABKAsyGi5nb29nbGUucHJvdG9idWYuVGltZXN0YW1wEikKBWN0aW1lGAcgASgLMhouZ29vZ2xlLnByb3RvYnVmLlRpbWVzdGFtcCKAAQoNRW50cnlNZXRhZGF0YRIMCgRwYXRoGAEgASgJEgwKBG5hbWUYAiABKAkSIwoEdHlwZRgDIAEoDjIVLndvZGUuZnMudjEuRW50cnlUeXBlEi4KCmF0dHJpYnV0ZXMYBCABKAsyGi53b2RlLmZzLnYxLkZpbGVBdHRyaWJ1dGVzIlYKDlJlYWRkaXJSZXF1ZXN0EgwKBHBhdGgYASABKAkSIwoEdHlwZRgCIAEoDjIVLndvZGUuZnMudjEuRW50cnlUeXBlEhEKCXJlY3Vyc2l2ZRgDIAEoCCJICg9SZWFkZGlyUmVzcG9uc2USJwoEZGF0YRgBIAMoCzIZLndvZGUuZnMudjEuRW50cnlNZXRhZGF0YRIMCgRwYXRoGAIgASgJIhsKC1N0YXRSZXF1ZXN0EgwKBHBhdGgYASABKAkiNwoMU3RhdFJlc3BvbnNlEicKBGRhdGEYASABKAsyGS53b2RlLmZzLnYxLkVudHJ5TWV0YWRhdGEiRwoLUmVhZFJlcXVlc3QSDAoEcGF0aBgBIAEoCRIOCgZvZmZzZXQYAiABKAMSEQoEc2l6ZRgDIAEoA0gAiAEBQgcKBV9zaXplIhwKDFJlYWRSZXNwb25zZRIMCgRkYXRhGAEgASgMIjoKDFdyaXRlUmVxdWVzdBIMCgRwYXRoGAEgASgJEg4KBm9mZnNldBgCIAEoAxIMCgRkYXRhGAMgASgMIiAKDVdyaXRlUmVzcG9uc2USDwoHd3JpdHRlbhgBIAEoAyKOAQoNQ3JlYXRlUmVxdWVzdBIMCgRwYXRoGAEgASgJEgwKBG5hbWUYAiABKAkSDAoEbW9kZRgDIAEoDRIjCgR0eXBlGAQgASgOMhUud29kZS5mcy52MS5FbnRyeVR5cGUSLgoKYXR0cmlidXRlcxgFIAEoCzIaLndvZGUuZnMudjEuRmlsZUF0dHJpYnV0ZXMiOQoOQ3JlYXRlUmVzcG9uc2USJwoEZGF0YRgBIAEoCzIZLndvZGUuZnMudjEuRW50cnlNZXRhZGF0YSIdCg1EZWxldGVSZXF1ZXN0EgwKBHBhdGgYASABKAkiEAoORGVsZXRlUmVzcG9uc2UiJwoLTW92ZVJlcXVlc3QSCwoDc3JjGAEgASgJEgsKA2RzdBgCIAEoCSI3CgxNb3ZlUmVzcG9uc2USJwoEZGF0YRgBIAEoCzIZLndvZGUuZnMudjEuRW50cnlNZXRhZGF0YSIpCg1SZW5hbWVSZXF1ZXN0EgsKA3NyYxgBIAEoCRILCgNkc3QYAiABKAkiOQoOUmVuYW1lUmVzcG9uc2USJwoEZGF0YRgBIAEoCzIZLndvZGUuZnMudjEuRW50cnlNZXRhZGF0YSInCgtDb3B5UmVxdWVzdBILCgNzcmMYASABKAkSCwoDZHN0GAIgASgJIjcKDENvcHlSZXNwb25zZRInCgRkYXRhGAEgASgLMhkud29kZS5mcy52MS5FbnRyeU1ldGFkYXRhIi0KC0dsb2JSZXF1ZXN0EgwKBHBhdGgYASABKAkSEAoIcGF0dGVybnMYAiADKAkiNwoMR2xvYlJlc3BvbnNlEicKBGRhdGEYASADKAsyGS53b2RlLmZzLnYxLkVudHJ5TWV0YWRhdGEqgAEKCUVudHJ5VHlwZRIPCgtVTlNQRUNJRklFRBAAEggKBEZJTEUQARINCglESVJFQ1RPUlkQAhILCgdTWU1MSU5LEAMSEAoMQkxPQ0tfREVWSUNFEAQSFAoQQ0hBUkFDVEVSX0RFVklDRRAFEggKBEZJRk8QBhIKCgZTT0NLRVQQBzLSBQoRRmlsZVN5c3RlbVNlcnZpY2USQgoHUmVhZGRpchIaLndvZGUuZnMudjEuUmVhZGRpclJlcXVlc3QaGy53b2RlLmZzLnYxLlJlYWRkaXJSZXNwb25zZRI5CgRTdGF0Ehcud29kZS5mcy52MS5TdGF0UmVxdWVzdBoYLndvZGUuZnMudjEuU3RhdFJlc3BvbnNlEjkKBFJlYWQSFy53b2RlLmZzLnYxLlJlYWRSZXF1ZXN0Ghgud29kZS5mcy52MS5SZWFkUmVzcG9uc2USPAoFV3JpdGUSGC53b2RlLmZzLnYxLldyaXRlUmVxdWVzdBoZLndvZGUuZnMudjEuV3JpdGVSZXNwb25zZRI/CgZDcmVhdGUSGS53b2RlLmZzLnYxLkNyZWF0ZVJlcXVlc3QaGi53b2RlLmZzLnYxLkNyZWF0ZVJlc3BvbnNlEj8KBkRlbGV0ZRIZLndvZGUuZnMudjEuRGVsZXRlUmVxdWVzdBoaLndvZGUuZnMudjEuRGVsZXRlUmVzcG9uc2USOQoETW92ZRIXLndvZGUuZnMudjEuTW92ZVJlcXVlc3QaGC53b2RlLmZzLnYxLk1vdmVSZXNwb25zZRI/CgZSZW5hbWUSGS53b2RlLmZzLnYxLlJlbmFtZVJlcXVlc3QaGi53b2RlLmZzLnYxLlJlbmFtZVJlc3BvbnNlEjkKBENvcHkSFy53b2RlLmZzLnYxLkNvcHlSZXF1ZXN0Ghgud29kZS5mcy52MS5Db3B5UmVzcG9uc2USOQoER2xvYhIXLndvZGUuZnMudjEuR2xvYlJlcXVlc3QaGC53b2RlLmZzLnYxLkdsb2JSZXNwb25zZRJRCgxMaXN0U2hvcnRjdXQSHy53b2RlLmZzLnYxLkxpc3RTaG9ydGN1dFJlcXVlc3QaIC53b2RlLmZzLnYxLkxpc3RTaG9ydGN1dFJlc3BvbnNlQkJaQGdpdGh1Yi5jb20vd2VuZXJtZS93ZWdvL2dlbi93ZW5lci93b2RlL2ZzL3YxO2ZpbGVzeXN0ZW1zZXJ2aWNldjFiBnByb3RvMw", [file_google_protobuf_timestamp]);

/**
 * Describes the message wode.fs.v1.Shortcut.
 * Use `create(ShortcutSchema)` to create a new message.
 */
export const ShortcutSchema = /*@__PURE__*/
  messageDesc(file_wode_fs_v1_FileSystemService, 0);

/**
 * Describes the message wode.fs.v1.ListShortcutRequest.
 * Use `create(ListShortcutRequestSchema)` to create a new message.
 */
export const ListShortcutRequestSchema = /*@__PURE__*/
  messageDesc(file_wode_fs_v1_FileSystemService, 1);

/**
 * Describes the message wode.fs.v1.ListShortcutResponse.
 * Use `create(ListShortcutResponseSchema)` to create a new message.
 */
export const ListShortcutResponseSchema = /*@__PURE__*/
  messageDesc(file_wode_fs_v1_FileSystemService, 2);

/**
 * Describes the message wode.fs.v1.FileAttributes.
 * Use `create(FileAttributesSchema)` to create a new message.
 */
export const FileAttributesSchema = /*@__PURE__*/
  messageDesc(file_wode_fs_v1_FileSystemService, 3);

/**
 * Describes the message wode.fs.v1.EntryMetadata.
 * Use `create(EntryMetadataSchema)` to create a new message.
 */
export const EntryMetadataSchema = /*@__PURE__*/
  messageDesc(file_wode_fs_v1_FileSystemService, 4);

/**
 * Describes the message wode.fs.v1.ReaddirRequest.
 * Use `create(ReaddirRequestSchema)` to create a new message.
 */
export const ReaddirRequestSchema = /*@__PURE__*/
  messageDesc(file_wode_fs_v1_FileSystemService, 5);

/**
 * Describes the message wode.fs.v1.ReaddirResponse.
 * Use `create(ReaddirResponseSchema)` to create a new message.
 */
export const ReaddirResponseSchema = /*@__PURE__*/
  messageDesc(file_wode_fs_v1_FileSystemService, 6);

/**
 * Describes the message wode.fs.v1.StatRequest.
 * Use `create(StatRequestSchema)` to create a new message.
 */
export const StatRequestSchema = /*@__PURE__*/
  messageDesc(file_wode_fs_v1_FileSystemService, 7);

/**
 * Describes the message wode.fs.v1.StatResponse.
 * Use `create(StatResponseSchema)` to create a new message.
 */
export const StatResponseSchema = /*@__PURE__*/
  messageDesc(file_wode_fs_v1_FileSystemService, 8);

/**
 * Describes the message wode.fs.v1.ReadRequest.
 * Use `create(ReadRequestSchema)` to create a new message.
 */
export const ReadRequestSchema = /*@__PURE__*/
  messageDesc(file_wode_fs_v1_FileSystemService, 9);

/**
 * Describes the message wode.fs.v1.ReadResponse.
 * Use `create(ReadResponseSchema)` to create a new message.
 */
export const ReadResponseSchema = /*@__PURE__*/
  messageDesc(file_wode_fs_v1_FileSystemService, 10);

/**
 * Describes the message wode.fs.v1.WriteRequest.
 * Use `create(WriteRequestSchema)` to create a new message.
 */
export const WriteRequestSchema = /*@__PURE__*/
  messageDesc(file_wode_fs_v1_FileSystemService, 11);

/**
 * Describes the message wode.fs.v1.WriteResponse.
 * Use `create(WriteResponseSchema)` to create a new message.
 */
export const WriteResponseSchema = /*@__PURE__*/
  messageDesc(file_wode_fs_v1_FileSystemService, 12);

/**
 * Describes the message wode.fs.v1.CreateRequest.
 * Use `create(CreateRequestSchema)` to create a new message.
 */
export const CreateRequestSchema = /*@__PURE__*/
  messageDesc(file_wode_fs_v1_FileSystemService, 13);

/**
 * Describes the message wode.fs.v1.CreateResponse.
 * Use `create(CreateResponseSchema)` to create a new message.
 */
export const CreateResponseSchema = /*@__PURE__*/
  messageDesc(file_wode_fs_v1_FileSystemService, 14);

/**
 * Describes the message wode.fs.v1.DeleteRequest.
 * Use `create(DeleteRequestSchema)` to create a new message.
 */
export const DeleteRequestSchema = /*@__PURE__*/
  messageDesc(file_wode_fs_v1_FileSystemService, 15);

/**
 * Describes the message wode.fs.v1.DeleteResponse.
 * Use `create(DeleteResponseSchema)` to create a new message.
 */
export const DeleteResponseSchema = /*@__PURE__*/
  messageDesc(file_wode_fs_v1_FileSystemService, 16);

/**
 * Describes the message wode.fs.v1.MoveRequest.
 * Use `create(MoveRequestSchema)` to create a new message.
 */
export const MoveRequestSchema = /*@__PURE__*/
  messageDesc(file_wode_fs_v1_FileSystemService, 17);

/**
 * Describes the message wode.fs.v1.MoveResponse.
 * Use `create(MoveResponseSchema)` to create a new message.
 */
export const MoveResponseSchema = /*@__PURE__*/
  messageDesc(file_wode_fs_v1_FileSystemService, 18);

/**
 * Describes the message wode.fs.v1.RenameRequest.
 * Use `create(RenameRequestSchema)` to create a new message.
 */
export const RenameRequestSchema = /*@__PURE__*/
  messageDesc(file_wode_fs_v1_FileSystemService, 19);

/**
 * Describes the message wode.fs.v1.RenameResponse.
 * Use `create(RenameResponseSchema)` to create a new message.
 */
export const RenameResponseSchema = /*@__PURE__*/
  messageDesc(file_wode_fs_v1_FileSystemService, 20);

/**
 * Describes the message wode.fs.v1.CopyRequest.
 * Use `create(CopyRequestSchema)` to create a new message.
 */
export const CopyRequestSchema = /*@__PURE__*/
  messageDesc(file_wode_fs_v1_FileSystemService, 21);

/**
 * Describes the message wode.fs.v1.CopyResponse.
 * Use `create(CopyResponseSchema)` to create a new message.
 */
export const CopyResponseSchema = /*@__PURE__*/
  messageDesc(file_wode_fs_v1_FileSystemService, 22);

/**
 * Describes the message wode.fs.v1.GlobRequest.
 * Use `create(GlobRequestSchema)` to create a new message.
 */
export const GlobRequestSchema = /*@__PURE__*/
  messageDesc(file_wode_fs_v1_FileSystemService, 23);

/**
 * Describes the message wode.fs.v1.GlobResponse.
 * Use `create(GlobResponseSchema)` to create a new message.
 */
export const GlobResponseSchema = /*@__PURE__*/
  messageDesc(file_wode_fs_v1_FileSystemService, 24);

/**
 * Describes the enum wode.fs.v1.EntryType.
 */
export const EntryTypeSchema = /*@__PURE__*/
  enumDesc(file_wode_fs_v1_FileSystemService, 0);

/**
 * @generated from enum wode.fs.v1.EntryType
 */
export const EntryType = /*@__PURE__*/
  tsEnum(EntryTypeSchema);

/**
 * @generated from service wode.fs.v1.FileSystemService
 */
export const FileSystemService = /*@__PURE__*/
  serviceDesc(file_wode_fs_v1_FileSystemService, 0);
