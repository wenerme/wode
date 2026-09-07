import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vite-plus/test';
import {
	ConsoleDisplaySettingsHeader,
	ConsoleDisplaySettingsLayout,
	ConsoleDisplaySettingsPanel,
	ConsoleThemeCatalog,
} from './console-display-settings';
import { defaultConsoleThemeOptions } from './console-theme-catalog';
import { ConsoleThemeComponentPreview } from './console-theme-component-preview';
import { ConsoleThemeDemo } from './console-theme-preview';

const reducedThemeOptions = [
	{ value: 'corporate', label: 'Corporate', colorScheme: 'light' as const },
	{ value: 'business', label: 'Business', colorScheme: 'dark' as const },
];

describe('console display settings primitives', () => {
	it('composes layout, configurable heading, native props, actions, and preview', () => {
		const markup = renderToStaticMarkup(
			<ConsoleDisplaySettingsLayout id='appearance-layout' preview={<div>preview body</div>}>
				<ConsoleDisplaySettingsHeader
					headingLevel={4}
					title='外观设置'
					description={<div data-testid='header-description'>主题与显示偏好</div>}
					actions={0}
				/>
				<div>settings body</div>
			</ConsoleDisplaySettingsLayout>,
		);

		expect(markup).toContain('id="appearance-layout"');
		expect(markup).toContain('<h4');
		expect(markup).toContain('外观设置');
		expect(markup).toContain('data-testid="header-description"');
		expect(markup).not.toContain('<p><div');
		expect(markup).toContain('settings body');
		expect(markup).toContain('aria-label="显示设置预览"');
		expect(markup).toContain('preview body');
		expect(markup).toContain('>0</div>');
	});

	it('filters an accessible theme radio catalog and renders an explicit empty state', () => {
		const filteredMarkup = renderToStaticMarkup(
			<ConsoleThemeCatalog
				themes={reducedThemeOptions}
				selectedTheme='business'
				query='BUSI'
				title='主题目录'
				onQueryChange={() => undefined}
				onThemeSelect={() => undefined}
			/>,
		);
		const emptyMarkup = renderToStaticMarkup(
			<ConsoleThemeCatalog themes={reducedThemeOptions} query='missing' empty='没有搜索结果' />,
		);
		const collapsedMarkup = renderToStaticMarkup(
			<ConsoleThemeCatalog themes={defaultConsoleThemeOptions} selectedTheme='corporate' collapsedCount={3} />,
		);

		expect(filteredMarkup).toContain('aria-label="主题目录"');
		expect(filteredMarkup).toContain('aria-label="搜索主题"');
		expect(filteredMarkup).toContain('value="business"');
		expect(filteredMarkup).toContain('checked=""');
		expect(filteredMarkup).not.toContain('value="corporate"');
		expect(emptyMarkup).toContain('没有搜索结果');
		expect(emptyMarkup).not.toContain('type="radio"');
		expect(collapsedMarkup.match(/type="radio"/g)).toHaveLength(3);
		expect(collapsedMarkup).toContain('value="corporate"');
		expect(collapsedMarkup).toContain('显示全部 36 个主题');
	});

	it('renders a real DaisyUI component matrix for size, tone, density, and radius', () => {
		const markup = renderToStaticMarkup(
			<ConsoleThemeComponentPreview
				theme={reducedThemeOptions[0]}
				size='lg'
				tone='warning'
				density='compact'
				radius='rounded'
				onSizeChange={() => undefined}
				onToneChange={() => undefined}
			/>,
		);

		expect(markup).toContain('data-theme="corporate"');
		expect(markup).toContain('data-density="compact"');
		expect(markup).toContain('data-radius="rounded"');
		expect(markup).toContain('--radius-box:0.75rem');
		expect(markup).toContain('btn-lg');
		expect(markup).toContain('btn-warning');
		expect(markup).toContain('checkbox-lg');
		expect(markup).toContain('progress-warning');
		expect(markup).toContain('aria-label="主题色板"');
		expect(markup).toContain('aria-label="组件预览输入框"');
		expect(markup).toContain('inert=""');
		expect(markup).toContain('aria-hidden="true"');
		expect(markup).not.toContain('role="tab"');

		const consoleMarkup = renderToStaticMarkup(<ConsoleThemeDemo theme={reducedThemeOptions[0]} />);
		expect(consoleMarkup).toContain('data-slot="console-theme-demo"');
		expect(consoleMarkup).toContain('inert=""');
		expect(consoleMarkup).toContain('aria-hidden="true"');
	});

	it('keeps the complete page ordered around preferences, mappings, preview, and catalog', () => {
		const markup = renderToStaticMarkup(
			<ConsoleDisplaySettingsPanel title='外观' headingLevel={4} themeOptions={reducedThemeOptions} />,
		);
		const preferencesIndex = markup.indexOf('>界面偏好</h5>');
		const mappingIndex = markup.indexOf('>主题映射</h5>');
		const catalogIndex = markup.indexOf('>选择亮色主题</h5>');

		expect(markup).toContain('<h4');
		expect(markup.match(/<h5/g)).toHaveLength(3);
		expect(markup).toContain('value="system"');
		expect(markup).toContain('value="reduced"');
		expect(markup).toContain('value="full"');
		expect(markup).toContain('role="radiogroup" aria-label="预览类型"');
		expect(markup).toContain('正在编辑亮色');
		expect(markup).toContain('Corporate');
		expect(preferencesIndex).toBeGreaterThan(-1);
		expect(mappingIndex).toBeGreaterThan(preferencesIndex);
		expect(catalogIndex).toBeGreaterThan(mappingIndex);
	});
});
