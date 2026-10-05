'use client';
import { WindowManagerProvider } from './WindowManagerContext';
import { WindowManagerHost, type WindowManagerHostProps } from './WindowManagerHost';
import { WindowManagerPersistence, type WindowManagerPersistenceProps } from './WindowManagerPersistence';
import type { WindowManagerStore } from './WindowManagerStore';
import type { WindowManagerCreateOptions } from './WindowManagerTypes';
import { type WindowOption, WindowOptionProvider } from './WindowOption';
export type WindowManagerRuntimeProps = WindowManagerHostProps & { option?: WindowOption; options?: WindowManagerCreateOptions; persistence?: false | WindowManagerPersistenceProps; store?: WindowManagerStore };
export function WindowManagerRuntime({ option, options, persistence = false, store, ...hostProps }: WindowManagerRuntimeProps) { const content = <WindowManagerProvider options={options} store={store}>{persistence ? <WindowManagerPersistence {...persistence} /> : null}<WindowManagerHost {...hostProps} /></WindowManagerProvider>; return option ? <WindowOptionProvider value={option}>{content}</WindowOptionProvider> : content; }
