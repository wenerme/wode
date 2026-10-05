import type { Meta, StoryObj } from '@storybook/react-vite';
import { FileText, Plus, TerminalSquare } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { MacOSWindowFrame } from './MacOSWindowFrame';
import { NaturalWindowFrame } from './NaturalWindowFrame';
import { WindowFrame, type WindowFrameProps } from './WindowFrame';
import { WindowManagerRuntime } from './WindowManager';
import { WindowManagerContent, WindowManagerControls, WindowManagerFrame, WindowManagerMenu, WindowManagerStatusBar, WindowManagerTitleBar, WindowManagerToolbar } from './WindowManagerChrome';
import { useWindowManagerActions, WindowManagerProvider } from './WindowManagerContext';
import { WindowManagerDock } from './WindowManagerDock';
import { WindowManagerHost } from './WindowManagerHost';
import type { ManagedWindow } from './WindowManagerTypes';
import { type WindowFrameStyle, WindowOptionProvider } from './WindowOption';
import { WindowsWindowFrame } from './WindowsWindowFrame';

function WorkspaceBackground() {
	const actions = useWindowManagerActions();
	return <div className='absolute inset-0 overflow-auto p-6'>
		<div className='border-base-300 bg-base-100 flex flex-wrap items-center gap-3 border p-4'>
			<div className='min-w-0 flex-1'><h1 className='text-sm font-semibold'>Window workspace</h1><p className='text-base-content/65 mt-1 text-xs'>Open, focus, minimize, maximize, and restore generic windows.</p></div>
			<button type='button' className='btn btn-primary btn-sm' onClick={() => actions.open({ key: 'log', kind: 'log', title: 'Activity log', bounds: { x: 320, y: 140, width: 520, height: 320 }, duplicate: 'focus-existing' })}><Plus aria-hidden='true' className='size-4' />Open activity log</button>
		</div>
	</div>;
}

function DockedWorkspaceStory() {
	return <WindowManagerProvider options={{ workspace: { width: 1080, height: 680, dock: { position: 'right', size: 58 } }, initialWindows: [{ key: 'welcome', kind: 'document', title: 'Workspace guide', bounds: { x: 72, y: 64, width: 560, height: 360 } }] }}>
		<WindowManagerHost background={<WorkspaceBackground />} className='h-svh min-h-[36rem]' renderContent={(win) => <div className='bg-base-100 min-h-full p-5'><h2 className='text-lg font-semibold'>{win.title}</h2><p className='text-base-content/65 mt-3 text-sm leading-6'>This content is supplied by the host application for the window kind.</p></div>} renderIcon={(win) => win.kind === 'log' ? <TerminalSquare aria-hidden='true' className='size-4' /> : <FileText aria-hidden='true' className='size-4' />} />
	</WindowManagerProvider>;
}

function RuntimeStory() {
	return <WindowManagerRuntime className='h-svh min-h-[36rem]' options={{ initialWindows: [{ key: 'runtime', kind: 'document', title: 'Runtime window' }] }} renderContent={(win) => <div className='p-5'>{win.title} is composed from the provider and host.</div>} />;
}

function ChromeStory() {
	return <div className='bg-base-200 grid min-h-svh place-items-center p-6'><WindowManagerFrame active className='h-96 w-full max-w-xl'>
		<WindowManagerTitleBar title='Window chrome' subtitle='Title bar, toolbar, content, and status bar' controls={<WindowManagerControls menu={<WindowManagerMenu onFullscreen={() => undefined} onPinnedChange={() => undefined} />} onClose={() => undefined} onMaximize={() => undefined} onMinimize={() => undefined} />} />
		<WindowManagerToolbar>Toolbar area</WindowManagerToolbar><WindowManagerContent className='p-5'>Scrollable window content.</WindowManagerContent><WindowManagerStatusBar>Saved</WindowManagerStatusBar>
	</WindowManagerFrame></div>;
}

function DockStory() {
	return <WindowManagerProvider options={{ workspace: { width: 960, height: 540, dock: { position: 'bottom', size: 52 } }, initialWindows: [{ key: 'dock', kind: 'document', title: 'Dock window' }] }}><div className='bg-base-200 relative h-72 overflow-hidden p-5'><div className='bg-base-100 border-base-300 h-full border p-4 pb-16 text-sm'>The dock is fixed to the bottom edge.</div><WindowManagerDock /></div></WindowManagerProvider>;
}

function FrameStylesStory() {
	const [style, setStyle] = useState<WindowFrameStyle>('natural');
	return <WindowOptionProvider value={{ style }}><WindowManagerRuntime className='h-svh min-h-[36rem]' options={{ workspace: { width: 960, height: 600 }, initialWindows: [{ key: 'styles', kind: 'document', title: 'Frame styles' }] }} background={<div className='absolute inset-0 bg-base-200 p-4'><div className='flex flex-wrap items-center gap-2'><span className='text-sm font-medium'>Frame style</span>{(['natural', 'macos', 'windows'] as const).map((value) => <button key={value} className={value === style ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'} type='button' onClick={() => setStyle(value)}>{value}</button>)}</div></div>} renderContent={(win) => <div className='bg-base-100 min-h-full p-5'><h2 className='text-lg font-semibold'>{win.title}</h2><p className='text-base-content/65 mt-3 text-sm'>The frame style keeps common window controls and capabilities.</p></div>} /></WindowOptionProvider>;
}

const galleryWindow: ManagedWindow = { id: 'gallery', kind: 'document', title: 'Frame gallery', mode: 'normal', bounds: { x: 0, y: 0, width: 360, height: 220 }, capabilities: { close: true, fullscreen: true, maximize: true, minimize: true, move: false, resize: false }, chrome: 'default', fullscreenRestoreMode: 'normal', persistence: 'none', pinned: false, restoreMode: 'normal', showInDock: true, size: { minHeight: 120, minWidth: 240 } };
const noopFrameActions: WindowFrameProps['actions'] = { close: () => true, fullscreen: () => true, maximize: () => true, minimize: () => true, setPinned: () => true, toggleFullscreen: () => true, toggleMaximize: () => true };

function GalleryFrame({ label, style, Frame }: { label: string; style?: WindowFrameStyle; Frame: (props: WindowFrameProps) => ReactNode }) {
	const frame = <Frame actions={noopFrameActions} active className='h-56' content={<div className='p-4 text-sm'><p className='text-base-content/65'>Directly rendered {label} without a manager store.</p><input aria-label={`${label} focus test`} className='input input-sm mt-3 w-full' placeholder='Focus test' /></div>} icon={<FileText aria-hidden='true' className='size-4' />} mode='normal' onClose={() => undefined} onFullscreen={() => undefined} onMaximize={() => undefined} onMinimize={() => undefined} onToggleMaximize={() => undefined} overlayZIndex={11_000} statusBar={<span className='text-xs'>{label}</span>} title={galleryWindow.title} titleId={`gallery-${label}`} win={galleryWindow} />;
	return <div className='grid gap-2'><h3 className='text-sm font-medium'>{label}</h3>{style ? <WindowOptionProvider value={{ style }}>{frame}</WindowOptionProvider> : frame}</div>;
}

function FrameGalleryStory() {
	return <div className='bg-base-200 grid min-h-svh gap-6 p-6 lg:grid-cols-2'><GalleryFrame label='NaturalWindowFrame' Frame={NaturalWindowFrame} /><GalleryFrame label='MacOSWindowFrame' Frame={MacOSWindowFrame} /><GalleryFrame label='WindowsWindowFrame' Frame={WindowsWindowFrame} /><GalleryFrame label='WindowFrame(style=macos)' style='macos' Frame={WindowFrame} /></div>;
}

const meta = { title: 'Components/Window Manager', component: DockedWorkspaceStory, parameters: { layout: 'fullscreen' } } satisfies Meta<typeof DockedWorkspaceStory>;
export default meta;
type Story = StoryObj<typeof meta>;
export const DockedWorkspace: Story = {};
export const Runtime: Story = { render: () => <RuntimeStory /> };
export const Chrome: Story = { render: () => <ChromeStory /> };
export const Dock: Story = { render: () => <DockStory /> };
export const FrameStyles: Story = { render: () => <FrameStylesStory /> };
export const FrameGallery: Story = { render: () => <FrameGalleryStory /> };
