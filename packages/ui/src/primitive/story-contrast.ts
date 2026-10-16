import { expect } from 'storybook/test';

type Color = [number, number, number, number];

export function assertTextContrast(elements: Iterable<HTMLElement>) {
	const targets = [...elements];
	expect(targets.length, 'The contrast matrix must render text samples').toBeGreaterThan(0);
	for (const element of targets) {
		const document = element.ownerDocument;
		const view = document.defaultView;
		if (!view) throw new Error('Contrast checks require a browser document');
		const canvas = document.createElement('canvas');
		canvas.width = canvas.height = 1;
		const context = canvas.getContext('2d', { willReadFrequently: true });
		if (!context) throw new Error('Contrast checks require a canvas context');
		const readColor = (color: string): Color => {
			context.clearRect(0, 0, 1, 1);
			context.fillStyle = color;
			context.fillRect(0, 0, 1, 1);
			const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data;
			return [red / 255, green / 255, blue / 255, alpha / 255];
		};
		let background: Color = [0, 0, 0, 0];
		for (let ancestor: HTMLElement | null = element; ancestor; ancestor = ancestor.parentElement) {
			background = composite(background, readColor(view.getComputedStyle(ancestor).backgroundColor));
			if (background[3] === 1) break;
		}
		background = composite(background, [1, 1, 1, 1]);
		const foreground = composite(readColor(view.getComputedStyle(element).color), background);
		const foregroundLuminance = luminance(foreground);
		const backgroundLuminance = luminance(background);
		const ratio =
			(Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
			(Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
		expect(ratio, `${element.textContent?.trim()} text contrast ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
	}
}

function composite(front: Color, back: Color): Color {
	const alpha = front[3] + back[3] * (1 - front[3]);
	if (alpha === 0) return [0, 0, 0, 0];
	return [
		(front[0] * front[3] + back[0] * back[3] * (1 - front[3])) / alpha,
		(front[1] * front[3] + back[1] * back[3] * (1 - front[3])) / alpha,
		(front[2] * front[3] + back[2] * back[3] * (1 - front[3])) / alpha,
		alpha,
	];
}

function luminance([red, green, blue]: Color) {
	const linearize = (value: number) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
	return 0.2126 * linearize(red) + 0.7152 * linearize(green) + 0.0722 * linearize(blue);
}
