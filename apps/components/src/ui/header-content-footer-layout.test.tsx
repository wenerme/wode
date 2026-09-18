import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vite-plus/test';
import { HeaderContentFooterLayout } from './header-content-footer-layout';

describe('HeaderContentFooterLayout', () => {
	it('renders ordered header, content, and footer slots', () => {
		const markup = renderToStaticMarkup(
			<HeaderContentFooterLayout
				className='surface'
				contentClassName='viewport'
				header={<header>Header</header>}
				footer={<footer>Footer</footer>}
			>
				<article>Content</article>
			</HeaderContentFooterLayout>,
		);
		expect(markup.indexOf('Header')).toBeLessThan(markup.indexOf('Content'));
		expect(markup.indexOf('Content')).toBeLessThan(markup.indexOf('Footer'));
		expect(markup).toContain('surface');
		expect(markup).toContain('viewport');
		expect(markup).toContain('overflow-auto');
	});

	it('allows consumers to own content overflow', () => {
		const markup = renderToStaticMarkup(
			<HeaderContentFooterLayout scrollContent={false}>Content</HeaderContentFooterLayout>,
		);
		expect(markup).not.toContain('overflow-auto');
	});
});
