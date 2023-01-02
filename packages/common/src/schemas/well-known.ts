/* eslint-disable @typescript-eslint/no-redeclare */
import { z } from 'zod';

export const Gender = z.enum(['male', 'female']);
export type Gender = z.infer<typeof Gender>;

export const UUID = z
  .string()
  .describe('UUID')
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
export type UUID = z.infer<typeof UUID>;

export const ULID = z
  .string()
  .describe('ULID')
  .regex(/^[0-9A-HJKMNP-TV-Z]{26}$/i);
export type ULID = z.infer<typeof ULID>;

export const USCI = z
  .string()
  .describe('统一社会信用代码')
  .regex(/^([159][1239]|Y1)[0-9]{6}[0-9A-HJ-NP-RTUWXY]{10}$/);
export type USCI = z.infer<typeof USCI>;

export const ChinaCitizenID = z
  .string()
  .describe('中国公民身份证')
  .regex(/^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}(\d|X)$/);
export type ChinaCitizenID = z.infer<typeof ChinaCitizenID>;

export const PhoneNumber = z
  .string()
  .describe('移动电话')
  .regex(/^1[3456789]\d{9}$/);
export const TelNumber = z
  .string()
  .describe('座机电话')
  .regex(/^(\d{3,4}-?)?\d{7,8}$/);

export const WellKnownSchemas = {
  UUID,
  ULID,
  Gender,
  ChinaCitizenID,
  PhoneNumber,
  TelNumber,
} as const;
