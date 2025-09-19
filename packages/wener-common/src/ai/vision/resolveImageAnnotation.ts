import type { ImageAnnotation } from './ImageAnnotationSchema';

export { resolveImageAnnotation };

export type ResolvedImageAnnotation = Omit<ImageAnnotation, 'id' | 'annotations' | 'attributes' | 'metadata'> & {
	id: string;
	annotations: ResolvedImageAnnotation[];
	attributes: Record<string, any>;
	metadata: Record<string, any>;
};

function resolveImageAnnotation(input: Partial<ImageAnnotation>): ResolvedImageAnnotation {
	const normalize = (
		input: ImageAnnotation,
		{
			path = [],
			level = 0,
		}: {
			path?: number[];
			level?: number;
		} = {},
	) => {
		input.id ||= path.join('.') || 'ROOT';
		input.annotations ||= [];
		input.tags ||= [];
		input.attributes ||= {};
		input.metadata ||= {};

		if (!input.csv && input.html?.includes('<table') && globalThis.DOMParser) {
			const parser = new DOMParser();
			const doc = parser.parseFromString(input.html, 'text/html');
			const table = doc.querySelector('table');

			if (table) {
				const rows = Array.from(table.querySelectorAll('tr'));
				input.data = rows.map((row) =>
					Array.from(row.querySelectorAll('td')).map((td) => td.textContent?.trim() || ''),
				);
			}
		}
		input.annotations.forEach((v, i) => normalize(v, { path: [...path, i], level: level + 1 }));

		resolveBBox(input);

		// can get bbox from annotations
		let first = input.annotations.find((v) => v.xyxy)?.xyxy;
		if (!input.xyxy && first) {
			const xyxy = input.annotations.reduce((acc, v) => {
				if (!v.xyxy) return acc;
				return [
					Math.min(acc[0], v.xyxy[0]),
					Math.min(acc[1], v.xyxy[1]),
					Math.max(acc[2], v.xyxy[2]),
					Math.max(acc[3], v.xyxy[3]),
				];
			}, first);
			input.xyxy = xyxy;
			input.xywh = xyxy2xywh(xyxy);
		}
	};

	const out = input as ResolvedImageAnnotation;
	normalize(out);
	// out.annotations.forEach((v) => norm(v));

	// only merge for root node

	if (!out.markdown) {
		out.markdown = out.annotations.map((v) => v.markdown).join('\n');
		out.markdown ||= undefined;
	}
	if (!out.text) {
		out.text = out.annotations.map((v) => v.text).join('\n');
		out.text ||= undefined;
	}
	// fallback
	out.text ||= out.markdown;
	out.markdown ||= out.text;
	return out;
}

function xywh2xyxy(input?: number[]) {
	if (!input) return;
	const [x, y, w, h] = input;
	return [x, y, x + w, y + h];
}

function xyxy2xywh(input?: number[]) {
	if (!input) return;
	const [x1, y1, x2, y2] = input;
	return [x1, y1, x2 - x1, y2 - y1];
}

type BBoxObject = {
	xywh: number[];
	xyxy: number[];
	x: number;
	y: number;
	w: number;
	h: number;
};

function resolveBBox(input: {
	xywh?: number[];
	xyxy?: number[];
	x?: number;
	y?: number;
	w?: number;
	h?: number;
}): BBoxObject | undefined {
	let { x, y, w, h } = input as {
		x: number;
		y: number;
		w: number;
		h: number;
	};
	let isNil = (v: any) => v === undefined || v === null;
	if (isNil(x) && input.xywh?.length) {
		[x, y, w, h] = input.xywh;
	}
	if (isNil(x) && input.xyxy?.length) {
		[x, y, w, h] = xyxy2xywh(input.xyxy)!;
	}
	if (!isNil(x)) {
		input.xywh ||= [x, y, w, h];
		input.xyxy ||= xywh2xyxy(input.xywh);
		input.x = x;
		input.y = y;
		input.w = w;
		input.h = h;

		return input as BBoxObject;
	}
	return;
}
