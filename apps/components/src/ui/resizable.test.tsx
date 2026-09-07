import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vite-plus/test';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './resizable';

describe('Resizable', () => {
	it('renders the shadcn v4 panel composition with an accessible separator', () => {
		const markup = renderToStaticMarkup(
			<ResizablePanelGroup id='layout' orientation='horizontal'>
				<ResizablePanel id='left'>Left</ResizablePanel>
				<ResizableHandle id='left-handle' withHandle />
				<ResizablePanel id='content'>Content</ResizablePanel>
			</ResizablePanelGroup>,
		);
		expect(markup).toContain('data-slot="resizable-panel-group"');
		expect(markup).toContain('data-slot="resizable-panel"');
		expect(markup).toContain('role="separator"');
		expect(markup).toContain('left-handle');
		expect(markup).toContain('relative z-10');
		expect(markup).toContain('w-0.5');
		expect(markup).toContain('aria-[orientation=horizontal]:h-0.5');
		expect(markup).toContain('hover:bg-info/70');
		expect(markup).toContain('data-[separator=hover]:bg-info/70');
		expect(markup).toContain('data-[separator=active]:bg-info');
	});
});
