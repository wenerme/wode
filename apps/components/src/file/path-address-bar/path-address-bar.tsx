'use client';

import { Menu as BaseMenu } from '@base-ui/react/menu';
import { ChevronDown, ChevronRight, CircleAlert, Ellipsis, Folder, LoaderCircle, Pencil } from 'lucide-react';
import type { ChangeEvent, KeyboardEvent, ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { PathAddressBarMenuItem } from './path-address-bar-menu-item';
import type { PathAddressBarMessages, PathAddressBarProps, PathAddressSegment } from './path-address-bar-types';
import { buildPathAddressSegments, calculatePathAddressVisibleStart } from './path-address-model';

const defaultMessages: PathAddressBarMessages = {
	navigationLabel: '当前位置',
	editLabel: '编辑路径',
	inputLabel: '路径',
	overflowLabel: '更多上级目录',
	loadingLabel: '正在加载路径',
	openPathLabel: (label) => `打开 ${label}`,
	currentMenuLabel: (label) => `打开 ${label} 菜单`,
};

const segmentClassName =
	'focus-visible:ring-primary inline-flex h-7 min-w-0 max-w-48 items-center rounded-sm px-2 text-sm font-medium outline-none focus-visible:ring-2';
const actionableSegmentClassName = 'hover:bg-base-200 disabled:pointer-events-none disabled:opacity-40';
const separatorClassName = 'text-base-content/35 flex size-4 shrink-0 items-center justify-center';
const overflowClassName =
	'hover:bg-base-200 focus-visible:ring-primary inline-flex size-7 shrink-0 items-center justify-center rounded-sm outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-40';

export function PathAddressBar({
	path,
	value,
	onValueChange,
	onValueCommit,
	onPathChange,
	rootPath = '/',
	rootLabel = '根目录',
	editable = true,
	disabled = false,
	loading = false,
	error,
	currentMenu,
	messages: messageOverrides,
	className,
	children,
	onKeyDown,
	'aria-label': ariaLabel,
	...props
}: PathAddressBarProps) {
	const messages = useMemo(() => ({ ...defaultMessages, ...messageOverrides }), [messageOverrides]);
	const segments = useMemo(() => buildPathAddressSegments(path, { rootPath, rootLabel }), [path, rootLabel, rootPath]);
	const visibilityKey = useMemo(
		() => segments.map((segment) => `${segment.path}\x00${segment.label}`).join('\x01'),
		[segments],
	);
	const [visibility, setVisibility] = useState({ key: visibilityKey, start: 0 });
	const visibleStart = visibility.key === visibilityKey ? Math.min(visibility.start, segments.length - 1) : 0;
	const hiddenSegments = visibleStart > 0 ? segments.slice(0, visibleStart) : [];
	const visibleSegments = segments.slice(visibleStart);
	const [editing, setEditing] = useState(false);
	const [internalValue, setInternalValue] = useState(path);
	const editValue = value ?? internalValue;
	const inputRef = useRef<HTMLInputElement>(null);
	const previousPathRef = useRef(path);
	const commitHandledRef = useRef(false);
	const viewportRef = useRef<HTMLElement>(null);
	const segmentMeasureRefs = useRef<Array<HTMLSpanElement | null>>([]);
	const separatorMeasureRef = useRef<HTMLSpanElement>(null);
	const overflowMeasureRef = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		if (previousPathRef.current === path) return;
		previousPathRef.current = path;
		commitHandledRef.current = false;
		setInternalValue(path);
		setEditing(false);
	}, [path]);

	useEffect(() => {
		if (!editing) return;
		inputRef.current?.focus();
		inputRef.current?.select();
	}, [editing]);

	useEffect(() => {
		if (typeof ResizeObserver === 'undefined') {
			setVisibility({ key: visibilityKey, start: 0 });
			return;
		}

		const viewport = viewportRef.current;
		const measuredSegments = segmentMeasureRefs.current.slice(0, segments.length);
		const separator = separatorMeasureRef.current;
		const overflow = overflowMeasureRef.current;
		if (!viewport || !separator || !overflow || measuredSegments.some((segment) => !segment)) return;

		const measure = () => {
			const widths = measuredSegments.map((segment) => segment?.getBoundingClientRect().width ?? 0);
			const start = calculatePathAddressVisibleStart(widths, viewport.getBoundingClientRect().width, {
				separatorWidth: separator.getBoundingClientRect().width,
				overflowWidth: overflow.getBoundingClientRect().width,
			});
			setVisibility((current) =>
				current.key === visibilityKey && current.start === start ? current : { key: visibilityKey, start },
			);
		};
		const observer = new ResizeObserver(measure);
		observer.observe(viewport);
		observer.observe(separator);
		observer.observe(overflow);
		for (const segment of measuredSegments) {
			if (segment) observer.observe(segment);
		}
		measure();
		return () => observer.disconnect();
	}, [segments, visibilityKey]);

	const beginEditing = () => {
		if (!editable || disabled) return;
		commitHandledRef.current = false;
		setInternalValue(path);
		setEditing(true);
	};
	const resetEditing = () => {
		if (commitHandledRef.current) return;
		if (editValue !== path) onValueChange?.(path);
		setInternalValue(path);
		setEditing(false);
	};
	const commitEditing = () => {
		if (commitHandledRef.current || disabled) return;
		commitHandledRef.current = true;
		if (onValueCommit) onValueCommit(editValue);
		else if (editValue !== path) onPathChange?.(editValue);
		setEditing(false);
	};
	const handleValueChange = (event: ChangeEvent<HTMLInputElement>) => {
		const nextValue = event.currentTarget.value;
		if (value === undefined) setInternalValue(nextValue);
		onValueChange?.(nextValue);
	};
	const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
			event.preventDefault();
			commitEditing();
			return;
		}
		if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();
			resetEditing();
		}
	};
	const handleRootKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		onKeyDown?.(event);
		if (event.defaultPrevented) return;
		if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLocaleLowerCase() === 'l') {
			event.preventDefault();
			if (editing) inputRef.current?.select();
			else beginEditing();
		}
	};

	return (
		<div
			data-slot='path-address-bar'
			data-editing={editing ? 'true' : 'false'}
			aria-label={ariaLabel}
			aria-busy={loading || undefined}
			aria-disabled={disabled || undefined}
			aria-invalid={Boolean(error) || undefined}
			className={cn(
				'border-base-300 bg-base-100 text-base-content relative flex h-9 min-w-0 items-center gap-1 rounded-md border px-1.5 text-sm',
				'focus-within:border-primary focus-within:ring-primary/30 focus-within:ring-1',
				disabled && 'opacity-60',
				className,
			)}
			onKeyDown={handleRootKeyDown}
			{...props}
		>
			{editing ? (
				<input
					ref={inputRef}
					type='text'
					data-slot='path-address-input'
					aria-label={messages.inputLabel}
					className='h-7 min-w-0 flex-1 bg-transparent px-1 text-sm outline-none'
					disabled={disabled}
					value={editValue}
					onBlur={resetEditing}
					onChange={handleValueChange}
					onKeyDown={handleInputKeyDown}
				/>
			) : (
				<>
					<nav
						ref={viewportRef}
						data-slot='path-address-breadcrumb'
						aria-label={messages.navigationLabel}
						className='flex min-w-0 flex-1 items-center overflow-hidden whitespace-nowrap'
					>
						{hiddenSegments.length ? (
							<HiddenAncestorMenu
								segments={hiddenSegments}
								disabled={disabled}
								label={messages.overflowLabel}
								onPathChange={onPathChange}
							/>
						) : null}
						{visibleSegments.map((segment, index) => (
							<PathSegment
								key={segment.path}
								segment={segment}
								disabled={disabled}
								currentMenu={currentMenu}
								messages={messages}
								showSeparator={hiddenSegments.length > 0 || index > 0}
								onPathChange={onPathChange}
							/>
						))}
					</nav>
					<div
						data-slot='path-address-measurements'
						aria-hidden='true'
						className='pointer-events-none invisible absolute top-0 left-0 flex h-0 overflow-hidden whitespace-nowrap'
					>
						{segments.map((segment, index) => (
							<span
								key={segment.path}
								ref={(node) => {
									segmentMeasureRefs.current[index] = node;
								}}
								className={cn(segmentClassName, 'shrink-0')}
							>
								<span className='truncate'>{segment.label}</span>
								{segment.isCurrent && currentMenu ? (
									<ChevronDown aria-hidden='true' className='ml-1 size-3.5 shrink-0' />
								) : null}
							</span>
						))}
						<span ref={separatorMeasureRef} className={separatorClassName}>
							<ChevronRight aria-hidden='true' className='size-3.5' />
						</span>
						<span ref={overflowMeasureRef} className={overflowClassName}>
							<Ellipsis aria-hidden='true' className='size-4' />
						</span>
					</div>
				</>
			)}
			{loading ? (
				<span role='status' aria-label={messages.loadingLabel} className='text-base-content/55 shrink-0'>
					<LoaderCircle aria-hidden='true' className='size-4 animate-spin motion-reduce:animate-none' />
				</span>
			) : null}
			{error ? (
				<div
					role='alert'
					title={typeof error === 'string' ? error : undefined}
					className='text-error flex max-w-48 min-w-0 shrink items-center gap-1'
				>
					<CircleAlert aria-hidden='true' className='size-4 shrink-0' />
					<div className='truncate text-xs'>{error}</div>
				</div>
			) : null}
			{children ? <div className='flex shrink-0 items-center gap-1'>{children}</div> : null}
			{editable && !editing ? (
				<button
					type='button'
					data-slot='path-address-edit'
					aria-label={messages.editLabel}
					title={messages.editLabel}
					className='btn btn-ghost btn-xs btn-square shrink-0 focus-visible:ring-2'
					disabled={disabled}
					onClick={beginEditing}
				>
					<Pencil aria-hidden='true' className='size-3.5' />
				</button>
			) : null}
		</div>
	);
}

function PathSegment({
	segment,
	showSeparator,
	disabled,
	currentMenu,
	messages,
	onPathChange,
}: {
	segment: PathAddressSegment;
	showSeparator: boolean;
	disabled: boolean;
	currentMenu?: ReactNode;
	messages: PathAddressBarMessages;
	onPathChange?: (path: string) => void;
}) {
	return (
		<>
			{showSeparator ? (
				<span aria-hidden='true' className={separatorClassName}>
					<ChevronRight className='size-3.5' />
				</span>
			) : null}
			{segment.isCurrent ? (
				currentMenu ? (
					<BaseMenu.Root>
						<BaseMenu.Trigger
							aria-current='page'
							aria-label={messages.currentMenuLabel(segment.label)}
							title={segment.label}
							disabled={disabled}
							className={cn(segmentClassName, actionableSegmentClassName, 'shrink')}
						>
							<span className='truncate'>{segment.label}</span>
							<ChevronDown aria-hidden='true' className='ml-1 size-3.5 shrink-0' />
						</BaseMenu.Trigger>
						<BaseMenu.Portal>
							<BaseMenu.Positioner align='end' side='bottom' sideOffset={4} className='z-60 outline-none'>
								<BaseMenu.Popup className='border-base-300 bg-base-100 text-base-content min-w-44 rounded-md border p-1 shadow-xl outline-none'>
									{currentMenu}
								</BaseMenu.Popup>
							</BaseMenu.Positioner>
						</BaseMenu.Portal>
					</BaseMenu.Root>
				) : (
					<span aria-current='page' title={segment.label} className={cn(segmentClassName, 'shrink')}>
						<span className='truncate'>{segment.label}</span>
					</span>
				)
			) : (
				<button
					type='button'
					aria-label={messages.openPathLabel(segment.label)}
					title={segment.label}
					className={cn(segmentClassName, actionableSegmentClassName, 'shrink-0')}
					disabled={disabled}
					onClick={() => onPathChange?.(segment.path)}
				>
					<span className='truncate'>{segment.label}</span>
				</button>
			)}
		</>
	);
}

function HiddenAncestorMenu({
	segments,
	disabled,
	label,
	onPathChange,
}: {
	segments: readonly PathAddressSegment[];
	disabled: boolean;
	label: string;
	onPathChange?: (path: string) => void;
}) {
	return (
		<BaseMenu.Root>
			<BaseMenu.Trigger aria-label={label} title={label} disabled={disabled} className={overflowClassName}>
				<Ellipsis aria-hidden='true' className='size-4' />
			</BaseMenu.Trigger>
			<BaseMenu.Portal>
				<BaseMenu.Positioner align='start' side='bottom' sideOffset={4} className='z-60 outline-none'>
					<BaseMenu.Popup className='border-base-300 bg-base-100 text-base-content w-60 max-w-[calc(100vw-1rem)] rounded-md border p-1 shadow-xl outline-none'>
						{segments.map((segment) => (
							<PathAddressBarMenuItem key={segment.path} onClick={() => onPathChange?.(segment.path)}>
								<Folder aria-hidden='true' className='text-base-content/55 size-4 shrink-0' />
								<span className='min-w-0 truncate'>{segment.label}</span>
							</PathAddressBarMenuItem>
						))}
					</BaseMenu.Popup>
				</BaseMenu.Positioner>
			</BaseMenu.Portal>
		</BaseMenu.Root>
	);
}
