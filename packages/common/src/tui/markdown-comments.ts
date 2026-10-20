/** Removes HTML comments outside fenced code blocks. */
export function stripMarkdownComments(markdown: string): string {
	let out = '';
	let index = 0;
	let inFence = false;
	let fenceMarker = '';
	const lineStartRe = /(^|\n)([ \t]*)(`{3,}|~{3,})/y;
	while (index < markdown.length) {
		lineStartRe.lastIndex = index;
		const fence = lineStartRe.exec(markdown);
		if (fence) {
			const marker = fence[3]?.[0] ?? '';
			if (!inFence) {
				inFence = true;
				fenceMarker = marker;
			} else if (marker === fenceMarker) {
				inFence = false;
				fenceMarker = '';
			}
		}
		if (!inFence && markdown.startsWith('<!--', index)) {
			const end = markdown.indexOf('-->', index + 4);
			if (end === -1) break;
			index = end + 3;
			continue;
		}
		out += markdown[index];
		index += 1;
	}
	return out;
}
