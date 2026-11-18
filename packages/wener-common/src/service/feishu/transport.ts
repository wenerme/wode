import { z } from 'zod';
import { FeishuServiceError, FeishuServiceErrorCodes } from './errors';
import {
	FeishuDownloadMessageResourceOutputSchema,
	type FeishuDownloadMessageResourceWireOutput,
	FeishuDownloadMessageResourceWireOutputSchema,
	FeishuUploadFileInputSchema,
	type FeishuUploadFileWireInput,
	FeishuUploadFileWireInputSchema,
	FeishuUploadImageInputSchema,
	type FeishuUploadImageWireInput,
	FeishuUploadImageWireInputSchema,
} from './schema';

/** Browser-safe Base64; no Node Buffer and no spread over the whole payload. */
export function encodeFeishuBase64(bytes: Uint8Array): string {
	const parts: string[] = [];
	for (let i = 0; i < bytes.byteLength; i += 8192) parts.push(String.fromCharCode(...bytes.subarray(i, i + 8192)));
	return btoa(parts.join(''));
}

/** Strict decode: the round trip must reproduce the input, so lenient decoders cannot smuggle bytes. */
export function decodeFeishuBase64(value: string, byteLength: number): Uint8Array {
	const binary = atob(value);
	if (binary.length !== byteLength || btoa(binary) !== value) throw new TypeError('Invalid Base64 content');
	return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function invalid(label: string): FeishuServiceError {
	return new FeishuServiceError(FeishuServiceErrorCodes.OperationFailed, `Invalid Feishu ${label}`);
}

type UploadImage = z.input<typeof FeishuUploadImageInputSchema>;
type UploadFile = z.input<typeof FeishuUploadFileInputSchema>;
type Resource = z.output<typeof FeishuDownloadMessageResourceOutputSchema>;

export function encodeFeishuUploadImage(input: UploadImage): FeishuUploadImageWireInput {
	const parsed = FeishuUploadImageInputSchema.safeParse(input);
	if (!parsed.success) throw invalid('image upload');
	const { image, ...rest } = parsed.data;
	const wire = FeishuUploadImageWireInputSchema.safeParse({ ...rest, imageBase64: encodeFeishuBase64(image), byteLength: image.byteLength });
	if (!wire.success) throw invalid('image upload');
	return wire.data;
}

export function decodeFeishuUploadImage(input: unknown): z.output<typeof FeishuUploadImageInputSchema> {
	const parsed = FeishuUploadImageWireInputSchema.safeParse(input);
	if (!parsed.success) throw invalid('image upload');
	const { imageBase64, byteLength, ...rest } = parsed.data;
	try {
		return { ...rest, image: decodeFeishuBase64(imageBase64, byteLength) };
	} catch {
		throw invalid('image upload');
	}
}

export function encodeFeishuUploadFile(input: UploadFile): FeishuUploadFileWireInput {
	const parsed = FeishuUploadFileInputSchema.safeParse(input);
	if (!parsed.success) throw invalid('file upload');
	const { file, ...rest } = parsed.data;
	const wire = FeishuUploadFileWireInputSchema.safeParse({ ...rest, fileBase64: encodeFeishuBase64(file), byteLength: file.byteLength });
	if (!wire.success) throw invalid('file upload');
	return wire.data;
}

export function decodeFeishuUploadFile(input: unknown): z.output<typeof FeishuUploadFileInputSchema> {
	const parsed = FeishuUploadFileWireInputSchema.safeParse(input);
	if (!parsed.success) throw invalid('file upload');
	const { fileBase64, byteLength, ...rest } = parsed.data;
	try {
		return { ...rest, file: decodeFeishuBase64(fileBase64, byteLength) };
	} catch {
		throw invalid('file upload');
	}
}

export function encodeFeishuResource(resource: Resource): FeishuDownloadMessageResourceWireOutput {
	const parsed = FeishuDownloadMessageResourceOutputSchema.safeParse(resource);
	if (!parsed.success) throw invalid('resource');
	const { data, ...rest } = parsed.data;
	const wire = FeishuDownloadMessageResourceWireOutputSchema.safeParse({ ...rest, contentBase64: encodeFeishuBase64(data), byteLength: data.byteLength });
	if (!wire.success) throw invalid('resource');
	return wire.data;
}

export function decodeFeishuResource(input: unknown): Resource {
	const parsed = FeishuDownloadMessageResourceWireOutputSchema.safeParse(input);
	if (!parsed.success) throw invalid('resource');
	const { contentBase64, byteLength, ...rest } = parsed.data;
	try {
		return { ...rest, data: decodeFeishuBase64(contentBase64, byteLength) };
	} catch {
		throw invalid('resource');
	}
}
