'use client';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { MacOSWindowFrame } from './MacOSWindowFrame';
import { NaturalWindowFrame } from './NaturalWindowFrame';
import type { ManagedWindow, WindowManagerActions, WindowManagerWindowMode } from './WindowManagerTypes';
import { useResolvedWindowFrameStyle, useWindowOption } from './WindowOption';
import { WindowsWindowFrame } from './WindowsWindowFrame';
export type WindowFrameActions = Pick<WindowManagerActions, 'close' | 'fullscreen' | 'maximize' | 'minimize' | 'setPinned' | 'toggleFullscreen' | 'toggleMaximize'>;
export type WindowFrameProps = Omit<ComponentPropsWithRef<'section'>, 'children' | 'content' | 'title'> & { actions: WindowFrameActions; active: boolean; content: ReactNode; icon?: ReactNode; menuItems?: ReactNode; mode: WindowManagerWindowMode; onClose: () => void; onFullscreen: () => void; onMaximize: () => void; onMinimize: () => void; onToggleMaximize: () => void; overlayZIndex: number; statusBar?: ReactNode; title?: ReactNode; titleId: string; toolbar?: ReactNode; win: ManagedWindow };
export function WindowFrame({ ...props }: WindowFrameProps) { const { style } = useWindowOption(); const resolvedStyle = useResolvedWindowFrameStyle(style); switch (resolvedStyle) { case 'macos': return <MacOSWindowFrame {...props} />; case 'windows': return <WindowsWindowFrame {...props} />; default: return <NaturalWindowFrame {...props} />; } }
