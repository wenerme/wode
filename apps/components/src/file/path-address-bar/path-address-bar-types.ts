import type { ComponentPropsWithRef, ReactNode } from 'react';

export type PathAddressSegment = {
	path: string;
	label: string;
	isRoot: boolean;
	isCurrent: boolean;
};

export type BuildPathAddressSegmentsOptions = {
	rootPath?: string;
	rootLabel?: string;
};

export type PathAddressVisibilityOptions = {
	separatorWidth?: number;
	overflowWidth?: number;
};

export type PathAddressBarMessages = {
	navigationLabel: string;
	editLabel: string;
	inputLabel: string;
	overflowLabel: string;
	loadingLabel: string;
	openPathLabel: (label: string) => string;
	currentMenuLabel: (label: string) => string;
};

export type PathAddressBarProps = ComponentPropsWithRef<'div'> & {
	path: string;
	value?: string;
	onValueChange?: (value: string) => void;
	onValueCommit?: (value: string) => void;
	onPathChange?: (path: string) => void;
	rootPath?: string;
	rootLabel?: string;
	editable?: boolean;
	disabled?: boolean;
	loading?: boolean;
	error?: ReactNode;
	currentMenu?: ReactNode;
	messages?: Partial<PathAddressBarMessages>;
};
