import Ajv2020 from 'ajv/dist/2020.js';
import { describe, expect, expectTypeOf, it } from 'vitest';
import type { IFeishuService } from './IFeishuService';
import { FeishuServiceContract, FeishuServiceWireContract, FeishuWriteOperations } from './FeishuServiceContract';
import { FeishuOperations } from './operations';
import * as schema from './schema';
import {
	decodeFeishuResource,
	decodeFeishuUploadFile,
	decodeFeishuUploadImage,
	encodeFeishuBase64,
	encodeFeishuResource,
	encodeFeishuUploadFile,
	encodeFeishuUploadImage,
} from './transport';

const reads = ['listChat', 'getChat', 'listChatMember', 'getUser', 'listMessage', 'getMessage', 'downloadMessageResource'];
const writes = ['replyMessage', 'addMessageReaction', 'uploadImage', 'uploadFile'];
const destructive = ['deleteMessage', 'deleteMessageReaction'];

describe('Feishu IM/contact contract expansion', () => {
	it('derives native binary types for the in-process service', () => {
		expectTypeOf<Parameters<IFeishuService['uploadImage']>[0]['image']>().toEqualTypeOf<Uint8Array>();
		expectTypeOf<Awaited<ReturnType<IFeishuService['downloadMessageResource']>>['data']>().toEqualTypeOf<Uint8Array>();
		expectTypeOf<Parameters<IFeishuService['listChat']>[0]>().toEqualTypeOf<
			{ userIdType?: 'open_id' | 'union_id' | 'user_id'; sortType?: 'ByCreateTimeAsc' | 'ByActiveTimeDesc'; pageSize?: number; pageToken?: string } | undefined
		>();
	});

	it('marks reads read-only, writes non-read-only and deletes destructive', () => {
		for (const name of reads) expect(FeishuOperations[name as keyof typeof FeishuOperations].tool.annotations).toMatchObject({ readOnlyHint: true, destructiveHint: false });
		for (const name of writes) expect(FeishuOperations[name as keyof typeof FeishuOperations].tool.annotations).toMatchObject({ readOnlyHint: false, destructiveHint: false });
		for (const name of destructive) expect(FeishuOperations[name as keyof typeof FeishuOperations].tool.annotations).toMatchObject({ readOnlyHint: false, destructiveHint: true });
		expect([...FeishuWriteOperations].sort()).toEqual(['sendMessage', 'sendWebhook', 'request', 'callWriteApi', ...writes, ...destructive].sort());
	});

	it('keeps wire and native keys identical and differs only for binary procedures', () => {
		expect(Object.keys(FeishuServiceWireContract)).toEqual(Object.keys(FeishuServiceContract));
		const changed = Object.keys(FeishuServiceContract).filter(
			(name) => FeishuServiceWireContract[name as keyof typeof FeishuServiceContract] !== FeishuServiceContract[name as keyof typeof FeishuServiceContract],
		);
		expect(changed).toEqual(['uploadImage', 'uploadFile', 'downloadMessageResource']);
	});

	it('exports wire tool schemas without native bytes and validates them with AJV', () => {
		const ajv = new Ajv2020({ strict: true, allowUnionTypes: true });
		const uploadImage = ajv.compile(FeishuOperations.uploadImage.tool.inputSchema);
		const resource = ajv.compile(FeishuOperations.downloadMessageResource.tool.outputSchema!);
		expect(JSON.stringify(FeishuOperations.uploadImage.tool.inputSchema)).toContain('imageBase64');
		expect(Object.keys((FeishuOperations.uploadImage.tool.inputSchema as { properties: object }).properties)).not.toContain('image');
		expect(Object.keys((FeishuOperations.downloadMessageResource.tool.outputSchema as { properties: object }).properties)).not.toContain('data');
		expect(uploadImage({ imageBase64: 'AQID', byteLength: 3 })).toBe(true);
		expect(uploadImage({ imageBase64: 'not base64!', byteLength: 3 })).toBe(false);
		expect(resource({ contentBase64: 'AQID', byteLength: 3, contentType: 'image/png' })).toBe(true);
		expect(resource({ contentBase64: 'AQID' })).toBe(false);
	});

	it('defaults optional inputs and enforces input invariants', () => {
		expect(schema.FeishuListChatInputSchema.parse(undefined)).toEqual({});
		expect(FeishuOperations.listChat.input.safeParse(undefined)).toEqual({ success: true, data: {} });
		expect(schema.FeishuListMessageInputSchema.safeParse({ chatId: 'oc_1', pageSize: 51 }).success).toBe(false);
		expect(schema.FeishuListChatInputSchema.safeParse({ pageSize: 101 }).success).toBe(false);
		expect(schema.FeishuGetUserInputSchema.safeParse({ userId: 'ou_1' }).success).toBe(true);
		expect(schema.FeishuGetUserInputSchema.safeParse({ email: 'a@example.test' }).success).toBe(true);
		expect(schema.FeishuGetUserInputSchema.safeParse({}).success).toBe(false);
		expect(schema.FeishuGetUserInputSchema.safeParse({ userId: 'ou_1', email: 'a@example.test' }).success).toBe(false);
		expect(schema.FeishuReplyMessageInputSchema.safeParse({ messageId: 'om_1', text: 'hi' }).success).toBe(true);
		expect(schema.FeishuReplyMessageInputSchema.safeParse({ messageId: 'om_1', content: '{}', msgType: 'post' }).success).toBe(true);
		expect(schema.FeishuReplyMessageInputSchema.safeParse({ messageId: 'om_1', content: '{}' }).success).toBe(false);
		expect(schema.FeishuReplyMessageInputSchema.safeParse({ messageId: 'om_1', text: 'hi', msgType: 'post' }).success).toBe(false);
		expect(schema.FeishuReplyMessageInputSchema.safeParse({ messageId: 'om_1', text: 'hi', content: '{}' }).success).toBe(false);
		expect(schema.FeishuUploadFileInputSchema.safeParse({ file: new Uint8Array([1]), fileType: 'pdf', fileName: '../x.pdf' }).success).toBe(false);
	});

	it('keeps unknown fields on dynamic chat/user/message outputs', () => {
		const chat = { chat_id: 'oc_1', name: 'n', future: { nested: [1, null] } };
		expect(schema.FeishuGetChatOutputSchema.parse(chat)).toEqual(chat);
		const user = { open_id: 'ou_1', name: 'n', status: { is_frozen: false }, custom_attrs: [{ id: 'x' }] };
		expect(schema.FeishuGetUserOutputSchema.parse(user)).toEqual(user);
		expect(schema.FeishuListMessageOutputSchema.parse({ items: [{ message_id: 'om_1', future: true }], hasMore: false }))
			.toEqual({ items: [{ message_id: 'om_1', future: true }], hasMore: false });
	});
});

describe('Feishu binary wire projection', () => {
	const bytes = Uint8Array.from({ length: 70_000 }, (_, i) => (i * 31) % 256);

	it('round-trips uploads and downloads byte-for-byte', () => {
		const image = encodeFeishuUploadImage({ image: bytes, filename: 'a.png' });
		expect(image).toMatchObject({ byteLength: bytes.byteLength, filename: 'a.png' });
		expect(decodeFeishuUploadImage(image).image).toEqual(bytes);
		const file = encodeFeishuUploadFile({ file: bytes, fileType: 'stream', fileName: 'a.bin', duration: 0 });
		expect(decodeFeishuUploadFile(file)).toMatchObject({ file: bytes, fileType: 'stream', fileName: 'a.bin', duration: 0 });
		const resource = encodeFeishuResource({ data: bytes, contentType: 'application/octet-stream', filename: 'a.bin' });
		expect(decodeFeishuResource(resource)).toEqual({ data: bytes, contentType: 'application/octet-stream', filename: 'a.bin' });
		expect(encodeFeishuBase64(new Uint8Array([1, 2, 3]))).toBe('AQID');
	});

	it('enforces size bounds on both projections', () => {
		expect(() => encodeFeishuUploadImage({ image: new Uint8Array(schema.FEISHU_MAX_IMAGE_BYTES + 1) })).toThrow('Invalid Feishu image upload');
		expect(() => encodeFeishuUploadImage({ image: new Uint8Array() })).toThrow('Invalid Feishu image upload');
		expect(() => encodeFeishuUploadFile({ file: new Uint8Array(schema.FEISHU_MAX_FILE_BYTES + 1), fileType: 'stream', fileName: 'a' }))
			.toThrow('Invalid Feishu file upload');
		const tooLong = 'A'.repeat(schema.feishuBase64Length(schema.FEISHU_MAX_IMAGE_BYTES) + 4);
		expect(() => decodeFeishuUploadImage({ imageBase64: tooLong, byteLength: schema.FEISHU_MAX_IMAGE_BYTES })).toThrow('Invalid Feishu image upload');
		expect(schema.FeishuDownloadMessageResourceInputSchema.safeParse({ messageId: 'om', fileKey: 'f', type: 'file', maxBytes: schema.FEISHU_MAX_RESOURCE_BYTES + 1 }).success).toBe(false);
	});

	it('rejects mismatched lengths and non-canonical Base64', () => {
		expect(() => decodeFeishuUploadImage({ imageBase64: 'AQID', byteLength: 2 })).toThrow('Invalid Feishu image upload');
		// 'AB==' decodes to one byte but is not the canonical encoding ('AA==').
		expect(() => decodeFeishuResource({ contentBase64: 'AB==', byteLength: 1 })).toThrow('Invalid Feishu resource');
		expect(() => decodeFeishuResource({ contentBase64: 'AQID', byteLength: 3, extra: true })).toThrow('Invalid Feishu resource');
	});
});
