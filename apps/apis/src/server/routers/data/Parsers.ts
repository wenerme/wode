import { parseULID, randomUUID, ulid } from '@wener/utils';
import { ChinaCitizenIdNo } from './gb11643/ChinaCitizenIdNo';
import { UnifiedSocialCreditId } from './gb31200/UnifiedSocialCreditId';
import { type Parser } from './parseIt';

export const Parsers: Parser[] = [
  {
    // wrV_AAAAAA0A0AAaAaaAaAAaaaAA-aaa
    name: 'WecomRoomIdFromWechat',
    title: 'Wecom Room ID from Wechat',
    // 28+4
    length: 32,
    pattern: /^wrV_[-a-zA-Z0-9]{28}$/,
    tags: ['wecom'],
  },
  {
    name: 'WecomMemberIdFromWechat',
    title: 'Wecom Member ID from Wechat',
    length: 32,
    pattern: /^wmV_[-a-zA-Z0-9]{28}$/,
    tags: ['wecom', 'wechat'],
  },
  {
    name: 'WecomRoomId',
    title: 'Wecom Room ID',
    length: 32,
    pattern: /^wr[-a-zA-Z0-9]{30}$/,
    tags: ['wecom'],
  },
  {
    name: 'WecomMemberId',
    title: 'Wecom Member ID',
    length: 32,
    pattern: /^wm[-a-zA-Z0-9]{30}$/,
    tags: ['wecom'],
  },
  {
    name: 'WecomCorpID',
    title: 'Wecom Corp ID/Suit ID',
    length: 32,
    pattern: /^ww[a-zA-Z0-9]{16}$/,
    tags: ['wecom'],
  },
  // wecom - wo OpenId, tj 早期套件
  {
    name: 'ChinaCitizenId',
    title: '中国公民身份证',
    description: 'Chinese National ID Card',
    length: ChinaCitizenIdNo.Length,
    pattern: ChinaCitizenIdNo.Pattern,
    parse: ChinaCitizenIdNo.parse,
    generate: () => ChinaCitizenIdNo.random().toString(),
    model: ChinaCitizenIdNo,
    tags: ['china'],
  },
  {
    name: 'USCI',
    title: '中国统一信用代码',
    description: 'Unified Social Credit Identifier',
    length: UnifiedSocialCreditId.Length,
    pattern: UnifiedSocialCreditId.Pattern,
    parse: UnifiedSocialCreditId.parse,
    generate: () => UnifiedSocialCreditId.random().toString(),
    model: UnifiedSocialCreditId,
    tags: ['china'],
  },
  {
    name: 'ULID',
    title: 'ULID',
    length: 26,
    pattern: /^[0-9A-HJKMNP-TV-Z]{26}$/i,
    parse: parseULID,
    generate: () => ulid(),
    tags: ['id'],
  },
  {
    name: 'UUID',
    title: 'UUID',
    length: 36,
    pattern: /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i,
    generate: () => randomUUID(),
    tags: ['id'],
  },
  {
    name: 'JsonObject',
    title: 'JSON Object',
    pattern: /^\{.*}$/,
    parse: (s) => JSON.parse(s),
  },
  {
    name: 'URL',
    title: 'URL',
    pattern: /^https?:\/\//i,
    parse: (s) => new URL(s),
  },
  // URI
  {
    name: 'Integer',
    title: '整数',
    pattern: /^[-+]?\d+(e\d+)?$/,
  },
  {
    name: 'Timestamp',
    title: '时间戳',
    pattern: /^\d{10,13}$/,
  },
  {
    name: 'Binary',
    title: '二进制',
    pattern: /^(0[bB])?[01]+$/,
  },
  {
    name: 'Octal',
    title: '八进制',
    pattern: /^(0[oO])?[0-7]+$/,
  },
  {
    name: 'Hex',
    title: 'Hex',
    pattern: /^(0x)?[0-9A-F]+$/i,
  },
  {
    name: 'Base32',
    title: 'Base32',
    pattern: /^[A-Z2-7]+$/i,
  },
  {
    name: 'Base64',
    title: 'Base64',
    pattern: /^[A-Za-z0-9+/]+={0,2}$/,
  },
];
