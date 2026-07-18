import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vite-plus/test';
import { buildPathAddressSegments, calculatePathAddressVisibleStart, PathAddressBar } from './index';

const segmentView = (path: string, rootPath = '/', rootLabel = '根目录') =>
	buildPathAddressSegments(path, { rootPath, rootLabel }).map(({ path: segmentPath, label, isCurrent }) => ({
		path: segmentPath,
		label,
		isCurrent,
	}));

describe('buildPathAddressSegments', () => {
	it('builds root-relative paths without exposing root ancestors', () => {
		expect(segmentView('/tenant/acme/project/src', '/tenant/acme', '工作区')).toEqual([
			{ path: '/tenant/acme', label: '工作区', isCurrent: false },
			{ path: '/tenant/acme/project', label: 'project', isCurrent: false },
			{ path: '/tenant/acme/project/src', label: 'src', isCurrent: true },
		]);
	});

	it('normalizes dot segments while containing traversal at the configured root', () => {
		expect(segmentView('/workspace/project/./src/../test', '/workspace')).toEqual([
			{ path: '/workspace', label: '根目录', isCurrent: false },
			{ path: '/workspace/project', label: 'project', isCurrent: false },
			{ path: '/workspace/project/test', label: 'test', isCurrent: true },
		]);
		expect(segmentView('/workspace/../private/secret', '/workspace', '安全根目录')).toEqual([
			{ path: '/workspace', label: '安全根目录', isCurrent: true },
		]);
	});

	it('preserves escaped segment text without URI decoding', () => {
		expect(segmentView('/files/%E4%B8%AD%E6%96%87/%2Freport', '/files')).toEqual([
			{ path: '/files', label: '根目录', isCurrent: false },
			{ path: '/files/%E4%B8%AD%E6%96%87', label: '%E4%B8%AD%E6%96%87', isCurrent: false },
			{ path: '/files/%E4%B8%AD%E6%96%87/%2Freport', label: '%2Freport', isCurrent: true },
		]);
	});

	it('falls back to the root for paths outside the root', () => {
		expect(segmentView('/other/private/path', '/workspace', '工作区')).toEqual([
			{ path: '/workspace', label: '工作区', isCurrent: true },
		]);
		expect(segmentView('/workspace', '/workspace/', '工作区')).toEqual([
			{ path: '/workspace', label: '工作区', isCurrent: true },
		]);
	});
});

describe('calculatePathAddressVisibleStart', () => {
	const widths = [40, 50, 60, 70];
	const options = { separatorWidth: 10, overflowWidth: 30 };

	it('keeps every segment when the measured content fits', () => {
		expect(calculatePathAddressVisibleStart(widths, 250, options)).toBe(0);
	});

	it('returns the earliest fitting suffix when ancestors overflow', () => {
		expect(calculatePathAddressVisibleStart(widths, 210, options)).toBe(2);
		expect(calculatePathAddressVisibleStart(widths, 240, options)).toBe(1);
	});

	it('always preserves the current segment in extremely narrow space', () => {
		expect(calculatePathAddressVisibleStart(widths, 1, options)).toBe(3);
		expect(calculatePathAddressVisibleStart([80], 0, options)).toBe(0);
	});

	it('treats invalid measurements as zero instead of propagating NaN', () => {
		expect(calculatePathAddressVisibleStart([Number.NaN, 50], 50, options)).toBe(1);
	});
});

describe('PathAddressBar static rendering', () => {
	it('renders deterministic root-relative breadcrumbs before browser measurement', () => {
		const markup = renderToStaticMarkup(
			<PathAddressBar
				path='/tenant/acme/project/%2Freport'
				rootPath='/tenant/acme'
				rootLabel='工作区'
				currentMenu={<span>目录操作</span>}
			/>,
		);

		expect(markup).toContain('data-slot="path-address-bar"');
		expect(markup).toContain('data-editing="false"');
		expect(markup).toContain('data-slot="path-address-breadcrumb"');
		expect(markup).toContain('aria-label="当前位置"');
		expect(markup).toContain('aria-current="page"');
		expect(markup).toContain('aria-label="编辑路径"');
		expect(markup).toContain('工作区');
		expect(markup).toContain('%2Freport');
		expect(markup).not.toContain('>tenant<');
		expect(markup).not.toContain('>acme<');
		expect(markup).not.toContain('aria-label="更多上级目录"');
		expect(markup).not.toContain('path-address-input');
	});

	it('exposes loading, errors, disabled state, and label overrides', () => {
		const markup = renderToStaticMarkup(
			<PathAddressBar
				disabled
				loading
				error='目录读取失败'
				path='/documents'
				messages={{ loadingLabel: '同步目录中', editLabel: '输入位置' }}
			/>,
		);

		expect(markup).toContain('aria-busy="true"');
		expect(markup).toContain('aria-disabled="true"');
		expect(markup).toContain('aria-invalid="true"');
		expect(markup).toContain('aria-label="同步目录中"');
		expect(markup).toContain('aria-label="输入位置"');
		expect(markup).toContain('role="alert"');
		expect(markup).toContain('目录读取失败');
	});

	it('accepts block-level custom error content without invalid inline nesting', () => {
		const markup = renderToStaticMarkup(
			<PathAddressBar error={<div data-custom-error=''>详细错误</div>} path='/documents' />,
		);
		expect(markup).toContain('<div role="alert"');
		expect(markup).toContain('<div data-custom-error="">详细错误</div>');
		expect(markup).not.toContain('<span role="alert"');
	});
});
