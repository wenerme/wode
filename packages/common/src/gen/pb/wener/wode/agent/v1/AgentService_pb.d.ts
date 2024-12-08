// @generated by protoc-gen-es v2.2.1
// @generated from file wener/wode/agent/v1/AgentService.proto (package wener.wode.agent.v1, syntax proto3)
/* eslint-disable */

import type { GenFile, GenMessage, GenService } from "@bufbuild/protobuf/codegenv1";
import type { Message } from "@bufbuild/protobuf";
import type { Timestamp } from "@bufbuild/protobuf/wkt";

/**
 * Describes the file wener/wode/agent/v1/AgentService.proto.
 */
export declare const file_wener_wode_agent_v1_AgentService: GenFile;

/**
 * @generated from message wener.wode.agent.v1.InfoRequest
 */
export declare type InfoRequest = Message<"wener.wode.agent.v1.InfoRequest"> & {
};

/**
 * Describes the message wener.wode.agent.v1.InfoRequest.
 * Use `create(InfoRequestSchema)` to create a new message.
 */
export declare const InfoRequestSchema: GenMessage<InfoRequest>;

/**
 * @generated from message wener.wode.agent.v1.InfoResponse
 */
export declare type InfoResponse = Message<"wener.wode.agent.v1.InfoResponse"> & {
  /**
   * @generated from field: google.protobuf.Timestamp now = 1;
   */
  now?: Timestamp;

  /**
   * @generated from field: google.protobuf.Timestamp started_at = 2;
   */
  startedAt?: Timestamp;

  /**
   * @generated from field: double uptime = 3;
   */
  uptime: number;

  /**
   * @generated from field: string timezone = 4;
   */
  timezone: string;

  /**
   * @generated from field: string locale = 5;
   */
  locale: string;
};

/**
 * Describes the message wener.wode.agent.v1.InfoResponse.
 * Use `create(InfoResponseSchema)` to create a new message.
 */
export declare const InfoResponseSchema: GenMessage<InfoResponse>;

/**
 * @generated from message wener.wode.agent.v1.ReloadRequest
 */
export declare type ReloadRequest = Message<"wener.wode.agent.v1.ReloadRequest"> & {
  /**
   * @generated from field: string reason = 1;
   */
  reason: string;
};

/**
 * Describes the message wener.wode.agent.v1.ReloadRequest.
 * Use `create(ReloadRequestSchema)` to create a new message.
 */
export declare const ReloadRequestSchema: GenMessage<ReloadRequest>;

/**
 * @generated from message wener.wode.agent.v1.ReloadResponse
 */
export declare type ReloadResponse = Message<"wener.wode.agent.v1.ReloadResponse"> & {
  /**
   * @generated from field: string message = 1;
   */
  message: string;
};

/**
 * Describes the message wener.wode.agent.v1.ReloadResponse.
 * Use `create(ReloadResponseSchema)` to create a new message.
 */
export declare const ReloadResponseSchema: GenMessage<ReloadResponse>;

/**
 * @generated from service wener.wode.agent.v1.AgentService
 */
export declare const AgentService: GenService<{
  /**
   * @generated from rpc wener.wode.agent.v1.AgentService.Info
   */
  info: {
    methodKind: "unary";
    input: typeof InfoRequestSchema;
    output: typeof InfoResponseSchema;
  },
  /**
   * @generated from rpc wener.wode.agent.v1.AgentService.Reload
   */
  reload: {
    methodKind: "unary";
    input: typeof ReloadRequestSchema;
    output: typeof ReloadResponseSchema;
  },
}>;

