import { type WechatBotMessageItem, WechatBotMessageItemType } from './types';

export function extractWechatBotText(items: WechatBotMessageItem[]): string {
	const parts: string[] = [];
	for (const item of items) {
		if (item.type === WechatBotMessageItemType.Text) {
			parts.push(item.text_item?.text ?? '');
			continue;
		}
		if (item.type === WechatBotMessageItemType.Image) {
			parts.push('(image)');
			continue;
		}
		if (item.type === WechatBotMessageItemType.Voice) {
			parts.push(item.voice_item?.text ?? '(voice)');
			continue;
		}
		if (item.type === WechatBotMessageItemType.File) {
			parts.push(`(file: ${item.file_item?.file_name ?? 'unknown'})`);
			continue;
		}
		if (item.type === WechatBotMessageItemType.Video) {
			parts.push('(video)');
			continue;
		}
		parts.push('(unknown)');
	}

	return parts.join('\n') || '(empty message)';
}

export function detectWechatBotMessageType(
	items: WechatBotMessageItem[],
): 'text' | 'image' | 'voice' | 'file' | 'video' | 'unknown' {
	const first = items[0];
	if (!first) return 'unknown';

	if (first.type === WechatBotMessageItemType.Text) return 'text';
	if (first.type === WechatBotMessageItemType.Image) return 'image';
	if (first.type === WechatBotMessageItemType.Voice) return 'voice';
	if (first.type === WechatBotMessageItemType.File) return 'file';
	if (first.type === WechatBotMessageItemType.Video) return 'video';
	return 'unknown';
}

export function chunkWechatBotText(text: string, limit = 2000): string[] {
	if (!text.trim()) {
		throw new Error('Message text cannot be empty');
	}
	if (limit <= 0) {
		throw new Error('Chunk limit must be greater than 0');
	}
	if (text.length <= limit) {
		return [text];
	}

	const chunks: string[] = [];
	let rest = text;
	while (rest.length > limit) {
		const paragraphCut = rest.lastIndexOf('\n\n', limit);
		const lineCut = rest.lastIndexOf('\n', limit);
		const spaceCut = rest.lastIndexOf(' ', limit);
		const cut =
			paragraphCut > limit / 2 ? paragraphCut : lineCut > limit / 2 ? lineCut : spaceCut > 0 ? spaceCut : limit;
		chunks.push(rest.slice(0, cut));
		rest = rest.slice(cut).replace(/^\n+/, '');
	}
	if (rest.length > 0) {
		chunks.push(rest);
	}
	return chunks;
}
