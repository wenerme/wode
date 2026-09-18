import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vite-plus/test';
import { LoginPageForm } from './login-form';
import {
	getSafeLoginPageHref,
	LOGIN_PAGE_BEIAN_URL,
	LoginPage,
	LoginPageComposite,
	LoginPageFooter,
	LoginPageLayout,
} from './login-page';

describe('login page composition', () => {
	it('supports complete region overrides without rendering defaults', () => {
		const markup = renderToStaticMarkup(
			<LoginPageComposite
				header={<div>custom header</div>}
				content={<div>custom content</div>}
				hero={<div>custom hero</div>}
				footer={<div>custom footer</div>}
			/>,
		);

		expect(markup).toContain('custom header');
		expect(markup).toContain('custom content');
		expect(markup).toContain('custom hero');
		expect(markup).toContain('custom footer');
		expect(markup).not.toContain('登录系统');
		expect(markup).not.toContain('type="password"');
	});

	it('assembles form, social providers, hero, and footer conveniences', () => {
		const markup = renderToStaticMarkup(
			<LoginPage.Composite
				title='Wener Console'
				subtitle='欢迎回来'
				headingId='login-title'
				showOrg
				orgValue='platform'
				formMode='email'
				defaultValues={{ email: 'ops@example.com', remember: true }}
				socials={[{ name: 'Passkey', onClick: () => undefined }]}
				hero={<div>operations image</div>}
				footerLinks={{ policy: { url: '/privacy' }, beian: { text: '沪ICP备123456号' } }}
			/>,
		);

		expect(markup).toContain('Wener Console');
		expect(markup).toContain('<h1 id="login-title"');
		expect(markup).toContain('name="org"');
		expect(markup).toContain('value="platform"');
		expect(markup).toContain('name="email"');
		expect(markup).not.toContain('name="username"');
		expect(markup).toContain('name="remember"');
		expect(markup).toContain('checked=""');
		expect(markup).toContain('Passkey');
		expect(markup).toContain('operations image');
		expect(markup).toContain('href="/privacy"');
		expect(markup).toContain(`href="${LOGIN_PAGE_BEIAN_URL}"`);
	});

	it('lets callers disable the default footer explicitly', () => {
		const markup = renderToStaticMarkup(<LoginPageComposite content='content' footer={null} />);

		expect(markup).toContain('content');
		expect(markup).not.toContain('login-page-footer-region');
	});

	it('keeps the footer in document flow', () => {
		const markup = renderToStaticMarkup(<LoginPageLayout content='content' footer='footer' />);

		expect(markup).toContain('data-slot="login-page-footer-region"');
		expect(markup).not.toContain('absolute inset-x-0 bottom-0');
	});
});

describe('login page form', () => {
	it('keeps the submit action reachable in onSubmit validation mode', () => {
		const markup = renderToStaticMarkup(<LoginPageForm validationMode='onSubmit' />);
		const submitButton = markup.match(/<button type="submit"[^>]*>/)?.[0];

		expect(submitButton).toBeDefined();
		expect(submitButton).not.toMatch(/\sdisabled(?:=|>)/);
		expect(markup).toContain('focus-within:ring-2');
		expect(markup).toContain('focus-within:ring-offset-2');
	});

	it('renders explicit email mode and a boolean remember control', () => {
		const markup = renderToStaticMarkup(
			<LoginPageForm mode='email' defaultValues={{ email: 'user@example.com', remember: true }} />,
		);

		expect(markup).toContain('type="email"');
		expect(markup).toContain('name="email"');
		expect(markup).not.toContain('name="username"');
		expect(markup).toContain('type="checkbox"');
		expect(markup).toContain('checked=""');
		expect(markup).toContain('aria-label="显示密码"');
	});
});

describe('login page footer links', () => {
	it.each([
		['https://example.com/legal', 'https://example.com/legal'],
		['/legal', '/legal'],
		['./legal', './legal'],
		['../legal', '../legal'],
		['#privacy', '#privacy'],
		['?view=terms', '?view=terms'],
		['legal/terms', 'legal/terms'],
	])('accepts safe href %s', (input, expected) => {
		expect(getSafeLoginPageHref(input)).toBe(expected);
	});

	it.each([
		'javascript:alert(1)',
		'data:text/html,unsafe',
		'vbscript:msgbox(1)',
		'http://example.com/legal',
		'//example.com/legal',
		'https://user:secret@example.com/legal',
		'https:\\example.com\\legal',
		'\u0000https://example.com',
	])('rejects unsafe href %s', (input) => {
		expect(getSafeLoginPageHref(input)).toBeUndefined();
	});

	it('renders secure external links, local links, and the default beian target', () => {
		const markup = renderToStaticMarkup(
			<LoginPageFooter
				policy={{ url: 'https://example.com/privacy' }}
				terms={{ url: '/terms' }}
				beian={{ text: '沪ICP备123456号' }}
				links={[{ text: 'unsafe', url: 'javascript:alert(1)' }]}
			/>,
		);

		expect(markup).toContain('href="https://example.com/privacy"');
		expect(markup).toContain('target="_blank"');
		expect(markup).toContain('rel="noopener noreferrer"');
		expect(markup).toContain('href="/terms"');
		expect(markup).toContain(`href="${LOGIN_PAGE_BEIAN_URL}"`);
		expect(markup).not.toContain('javascript:');
		expect(markup).not.toContain('unsafe');
	});
});
