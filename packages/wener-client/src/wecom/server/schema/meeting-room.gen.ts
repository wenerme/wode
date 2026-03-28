// Code generated from WeChat Work API documentation. DO NOT EDIT.
import { z } from 'zod';

/**
 * 添加会议室
 * @see https://developer.work.weixin.qq.com/document/path/93619
 */
export const AddMeetingRoomRequestSchema = z.object({
  /** 会议室名称，最多30个字符 */
  name: z.string().min(1).max(30),
  /** 会议室所能容纳的人数 */
  capacity: z.number().min(1),
  /** 会议室所在城市 */
  city: z.string().min(1).optional(),
  /** 会议室所在楼宇 */
  building: z.string().min(1).optional(),
  /** 会议室所在楼层 */
  floor: z.string().min(1).optional(),
  /** 会议室支持的设备列表 (1-电视, 2-电话, 3-投影, 4-白板, 5-视频) */
  equipment: z.number().optional(),
  /** 会议室所在建筑坐标 */
  coordinate: z.object({ latitude: z.string().min(1), longitude: z.string().min(1) }).optional(),
  /** 会议室使用范围 */
  range: z.object({ user_list: z.array(z.string()), department_list: z.array(z.number()) }).optional(),
});
export type AddMeetingRoomRequest = z.infer<typeof AddMeetingRoomRequestSchema>;
export const AddMeetingRoomResponseSchema = z.object({
  /** 会议室的id */
  meetingroom_id: z.number().optional(),
});
export type AddMeetingRoomResponse = z.infer<typeof AddMeetingRoomResponseSchema>;

/**
 * 查询会议室的预定信息
 * @see https://developer.work.weixin.qq.com/document/path/93620
 */
export const GetMeetingRoomBookingInfoRequestSchema = z.object({
  /** 会议室id */
  meetingroom_id: z.number().optional(),
  /** 查询预定的起始时间，默认为当前时间 [timestamp] */
  start_time: z.number().default('current_time').optional(),
  /** 查询预定的结束时间，默认为明日0时 [timestamp] */
  end_time: z.number().default('tomorrow_00:00').optional(),
  /** 会议室所在城市 */
  city: z.string().min(1).max(64).optional(),
  /** 会议室所在楼宇 */
  building: z.string().min(1).max(64).optional(),
  /** 会议室所在楼层 */
  floor: z.string().min(1).max(64).optional(),
});
export type GetMeetingRoomBookingInfoRequest = z.infer<typeof GetMeetingRoomBookingInfoRequestSchema>;
export const GetMeetingRoomBookingInfoResponseSchema = z.object({
  /** 会议室预订信息列表 */
  booking_list: z.array(z.object({ meetingroom_id: z.number(), schedule: z.array(z.object({ booking_id: z.string(), schedule_id: z.string(), start_time: z.number(), end_time: z.number(), booker: z.string(), status: z.number() })) })).optional(),
});
export type GetMeetingRoomBookingInfoResponse = z.infer<typeof GetMeetingRoomBookingInfoResponseSchema>;

