import { describe, expect, it } from 'vite-plus/test';
import { calculateZoomObjectFitRect, calculateZoomTargetRect } from './zoom';

describe('calculateZoomTargetRect', () => {
	it('fits a landscape image within the viewport margin', () => {
		const rect = calculateZoomTargetRect({
			naturalWidth: 1600,
			naturalHeight: 900,
			sourceWidth: 320,
			sourceHeight: 180,
			viewportWidth: 1200,
			viewportHeight: 800,
			margin: 32,
		});

		expect(rect.left).toBeCloseTo(32);
		expect(rect.top).toBeCloseTo(80.5);
		expect(rect.width).toBeCloseTo(1136);
		expect(rect.height).toBeCloseTo(639);
	});

	it('fits a portrait image by height and centers it', () => {
		const rect = calculateZoomTargetRect({
			naturalWidth: 900,
			naturalHeight: 1600,
			sourceWidth: 180,
			sourceHeight: 320,
			viewportWidth: 1200,
			viewportHeight: 800,
			margin: 32,
		});

		expect(rect.left).toBeCloseTo(393);
		expect(rect.top).toBeCloseTo(32);
		expect(rect.width).toBeCloseTo(414);
		expect(rect.height).toBeCloseTo(736);
	});

	it('falls back to rendered dimensions before natural dimensions are available', () => {
		const rect = calculateZoomTargetRect({
			naturalWidth: 0,
			naturalHeight: 0,
			sourceWidth: 300,
			sourceHeight: 200,
			viewportWidth: 1000,
			viewportHeight: 800,
			margin: 24,
		});

		expect(rect.left).toBeCloseTo(24);
		expect(rect.top).toBeCloseTo(82.6667);
		expect(rect.width).toBeCloseTo(952);
		expect(rect.height).toBeCloseTo(634.6667);
	});
});

describe('calculateZoomObjectFitRect', () => {
	it('reproduces a centered object-cover crop', () => {
		const rect = calculateZoomObjectFitRect({
			containerWidth: 320,
			containerHeight: 180,
			naturalWidth: 1500,
			naturalHeight: 1000,
			objectFit: 'cover',
			objectPosition: '50% 50%',
		});

		expect(rect.left).toBeCloseTo(0);
		expect(rect.top).toBeCloseTo(-16.6667);
		expect(rect.width).toBeCloseTo(320);
		expect(rect.height).toBeCloseTo(213.3333);
	});

	it('honors object-position while cropping', () => {
		const rect = calculateZoomObjectFitRect({
			containerWidth: 320,
			containerHeight: 180,
			naturalWidth: 1500,
			naturalHeight: 1000,
			objectFit: 'cover',
			objectPosition: '100% 0%',
		});

		expect(rect.left).toBeCloseTo(0);
		expect(rect.top).toBeCloseTo(0);
	});

	it('centers an object-contain image without cropping', () => {
		const rect = calculateZoomObjectFitRect({
			containerWidth: 320,
			containerHeight: 180,
			naturalWidth: 1000,
			naturalHeight: 1500,
			objectFit: 'contain',
		});

		expect(rect.left).toBeCloseTo(100);
		expect(rect.top).toBeCloseTo(0);
		expect(rect.width).toBeCloseTo(120);
		expect(rect.height).toBeCloseTo(180);
	});

	it('supports edge offsets and their computed calc form', () => {
		for (const objectPosition of ['right 12px bottom 8px', 'calc(100% - 12px) calc(100% - 8px)']) {
			const rect = calculateZoomObjectFitRect({
				containerWidth: 320,
				containerHeight: 180,
				naturalWidth: 2000,
				naturalHeight: 1000,
				objectFit: 'cover',
				objectPosition,
			});

			expect(rect.left).toBeCloseTo(-52);
			expect(rect.top).toBeCloseTo(-8);
			expect(rect.width).toBeCloseTo(360);
			expect(rect.height).toBeCloseTo(180);
		}
	});

	it('supports mixed percentage and pixel calc positions', () => {
		const rect = calculateZoomObjectFitRect({
			containerWidth: 320,
			containerHeight: 180,
			naturalWidth: 1500,
			naturalHeight: 1000,
			objectFit: 'cover',
			objectPosition: 'calc(25% + 8px) 75%',
		});

		expect(rect.left).toBeCloseTo(8);
		expect(rect.top).toBeCloseTo(-25);
	});

	it('normalizes center with a horizontal edge keyword', () => {
		const left = calculateZoomObjectFitRect({
			containerWidth: 320,
			containerHeight: 180,
			naturalWidth: 2000,
			naturalHeight: 1000,
			objectFit: 'cover',
			objectPosition: 'center left',
		});
		const right = calculateZoomObjectFitRect({
			containerWidth: 320,
			containerHeight: 180,
			naturalWidth: 2000,
			naturalHeight: 1000,
			objectFit: 'cover',
			objectPosition: 'center right',
		});

		expect(left.left).toBeCloseTo(0);
		expect(right.left).toBeCloseTo(-40);
	});
});
