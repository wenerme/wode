import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vite-plus/test';
import { ConsoleAboutPage, ConsoleAboutSection } from './console-about';
import { ConsoleAboutClientInfo } from './console-about-client';

describe('ConsoleAboutPage', () => {
	it('preserves legacy summary and enhanced regions', () => {
		const markup = renderToStaticMarkup(
			<ConsoleAboutPage
				id='about-page'
				product='Example Console'
				description='Operations workspace'
				version='1.2.3'
				build='2026.07.16'
				environment='Production'
				status={{ label: '运行正常', tone: 'success' }}
				actions={<button type='button'>检查更新</button>}
				details={[{ label: '运行时', value: 'React 19', description: 'Server rendered' }]}
				diagnostics={<div>Client diagnostics</div>}
				maintainers={[{ name: 'Platform Team', role: 'Maintainer', href: 'https://example.com/team' }]}
				support={<p>联系组织管理员获取支持。</p>}
				footer='Copyright 2026 Example Organization'
				links={[
					{ label: 'Local help', href: '/help', external: false },
					{ label: 'Release notes', href: 'https://example.com/releases', rel: 'nofollow' },
				]}
			/>,
		);

		expect(markup).toContain('id="about-page"');
		expect(markup).toContain('<h1');
		expect(markup).toContain('版本');
		expect(markup).toContain('badge-success');
		expect(markup).toContain('运行信息');
		expect(markup).toContain('客户端环境');
		expect(markup).toContain('Platform Team');
		expect(markup).toContain('Copyright 2026');
		expect(markup).toContain('href="/help"');
		expect(markup).not.toContain('href="/help" target="_blank"');
		expect(markup).toContain('target="_blank"');
		expect(markup).toContain('rel="nofollow noopener noreferrer"');
		expect(markup).toContain('Release notes，将在新窗口打开');
	});

	it('renders zero values and supports composable sections and messages', () => {
		const markup = renderToStaticMarkup(
			<ConsoleAboutPage product='Example Console' version={0} messages={{ versionLabel: 'Release' }}>
				<ConsoleAboutSection title='Security' description='Application-owned boundary' footer='Verified'>
					<p>No credentials are read.</p>
				</ConsoleAboutSection>
			</ConsoleAboutPage>,
		);

		expect(markup).toContain('Release');
		expect(markup).toContain('>0</dd>');
		expect(markup).toContain('Security');
		expect(markup).toContain('Application-owned boundary');
		expect(markup).toContain('Verified');
	});
});

describe('ConsoleAboutClientInfo', () => {
	it('renders an SSR-safe placeholder before browser diagnostics hydrate', () => {
		const markup = renderToStaticMarkup(
			<ConsoleAboutClientInfo
				data-client-info
				messages={{ viewportLabel: 'Viewport', userAgentSummary: 'User agent', unavailable: 'Unknown' }}
			/>,
		);
		expect(markup).toContain('data-client-info="true"');
		expect(markup).toContain('Viewport');
		expect(markup).toContain('设备像素比');
		expect(markup).toContain('User agent');
		expect(markup).toContain('Unknown');
	});
});
