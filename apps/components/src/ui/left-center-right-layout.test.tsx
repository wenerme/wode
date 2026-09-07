import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vite-plus/test';
import { LeftCenterRightLayout } from './left-center-right-layout';

describe('LeftCenterRightLayout', () => {
	it('renders explicit left, center, and right slots', () => {
		const markup = renderToStaticMarkup(
			<LeftCenterRightLayout
				className='status-layout'
				left={<span>Left</span>}
				center={<span>Center</span>}
				right={<span>Right</span>}
			/>,
		);
		expect(markup.indexOf('Left')).toBeLessThan(markup.indexOf('Center'));
		expect(markup.indexOf('Center')).toBeLessThan(markup.indexOf('Right'));
		expect(markup).toContain('status-layout');
		expect(markup).toContain('grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]');
	});

	it('uses children as the center slot fallback and forwards slot classes', () => {
		const markup = renderToStaticMarkup(
			<LeftCenterRightLayout leftClassName='left-slot' centerClassName='center-slot' rightClassName='right-slot'>
				Fallback center
			</LeftCenterRightLayout>,
		);
		expect(markup).toContain('Fallback center');
		expect(markup).toContain('left-slot');
		expect(markup).toContain('center-slot');
		expect(markup).toContain('right-slot');
		expect(markup.match(/overflow-hidden/g)).toHaveLength(3);
	});
});
