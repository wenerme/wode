'use client';
import { createContext, type PropsWithChildren, useContext, useEffect, useState } from 'react';
export type WindowFrameStyle = 'system' | 'macos' | 'windows' | 'natural';
export type WindowOption = { readonly style: WindowFrameStyle };
export const defaultWindowOption: WindowOption = { style: 'system' };
export const WindowOptionContext = createContext<WindowOption>(defaultWindowOption);
export function WindowOptionProvider({ children, value = defaultWindowOption }: PropsWithChildren<{ value?: WindowOption }>) { return <WindowOptionContext.Provider value={value}>{children}</WindowOptionContext.Provider>; }
export function useWindowOption() { return useContext(WindowOptionContext); }
export function resolveWindowFrameStyle(style: WindowFrameStyle, userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent): Exclude<WindowFrameStyle, 'system'> {
	if (style !== 'system') return style;
	if (userAgent.includes('Windows')) return 'windows';
	if (userAgent.includes('Mac')) return 'macos';
	return 'natural';
}

export function useResolvedWindowFrameStyle(style: WindowFrameStyle): Exclude<WindowFrameStyle, 'system'> {
	const [resolvedStyle, setResolvedStyle] = useState<Exclude<WindowFrameStyle, 'system'>>(() => (style === 'system' ? 'natural' : style));
	useEffect(() => {
		setResolvedStyle(resolveWindowFrameStyle(style));
	}, [style]);
	return resolvedStyle;
}
