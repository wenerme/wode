import type Emittery from 'emittery';

export const FileTreeEventType = {
	AbortRequested: 'FileTree:AbortRequested',
	LoadRequested: 'FileTree:LoadRequested',
	NavigateRequested: 'FileTree:NavigateRequested',
	RefreshRequested: 'FileTree:RefreshRequested',
	RevealRequested: 'FileTree:RevealRequested',
	SelectionRequested: 'FileTree:SelectionRequested',
} as const;

export type FileTreeLoadReason = 'expand' | 'retry' | 'reveal' | 'root';

export type FileTreeEventData = {
	[FileTreeEventType.AbortRequested]: { generation: number; path?: string };
	[FileTreeEventType.LoadRequested]: { generation: number; path: string; reason: FileTreeLoadReason };
	[FileTreeEventType.NavigateRequested]: { path: string };
	[FileTreeEventType.RefreshRequested]: { generation: number };
	[FileTreeEventType.RevealRequested]: { generation: number; path: string };
	[FileTreeEventType.SelectionRequested]: { path?: string };
};

export type FileTreeEmitter = Emittery<FileTreeEventData>;
