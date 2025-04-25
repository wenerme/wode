import React, { type ComponentPropsWithRef, type ComponentType } from 'react';
import {
	PiCalendarDotsLight,
	PiChartBarLight,
	PiDotsThreeLight,
	PiKanbanLight,
	PiListDashesLight,
	PiMapTrifoldLight,
	PiSlideshowLight,
	PiSquaresFourLight,
	PiTableLight,
	PiTreeViewLight,
} from 'react-icons/pi';
import { cn } from '../utils/cn';
import type { EnumValues } from './types';

export const ViewMode = Object.freeze({
	__proto__: null,
	calendar: 'calendar',
	chart: 'chart',
	gallery: 'gallery',
	grid: 'grid',
	kanban: 'kanban',
	list: 'list',
	map: 'map',
	table: 'table',
	timeline: 'timeline',
	tree: 'tree',
} as const);
export type ViewMode = EnumValues<typeof ViewMode>;

const ModeIcons: Record<string, ComponentType> = {
	calendar: PiCalendarDotsLight,
	chart: PiChartBarLight,
	gallery: PiSlideshowLight,
	grid: PiSquaresFourLight,
	kanban: PiKanbanLight,
	list: PiListDashesLight,
	map: PiMapTrifoldLight,
	table: PiTableLight,
	timeline: PiDotsThreeLight,
	tree: PiTreeViewLight,
};
type ViewModeInputProps<T extends ViewMode = ViewMode> = {
	value: string;
	onValueChange?: (s: T) => void;
	options?: T[];
} & ComponentPropsWithRef<'div'>;

const ViewModes = {
	calendar: { value: 'calendar', label: '日历', icon: PiCalendarDotsLight },
	chart: { value: 'chart', label: '图表', icon: PiChartBarLight },
	gallery: { value: 'gallery', label: '画廊', icon: PiSlideshowLight },
	grid: { value: 'grid', label: '网格', icon: PiSquaresFourLight },
	kanban: { value: 'kanban', label: '看板', icon: PiKanbanLight },
	list: { value: 'list', label: '列表', icon: PiListDashesLight },
	map: { value: 'map', label: '地图', icon: PiMapTrifoldLight },
	table: { value: 'table', label: '表格', icon: PiTableLight },
	timeline: { value: 'timeline', label: '时间线', icon: PiDotsThreeLight },
	tree: { value: 'tree', label: '树状图', icon: PiTreeViewLight },
};

export function ViewModeInput<T extends ViewMode>({
	value,
	onValueChange,
	options = [],
	className,
	...props
}: ViewModeInputProps<T>) {
	if (options.length < 2) {
		return null;
	}
	if (options.length === 2) {
		const IconA = ViewModes[options[0]].icon;
		const IconB = ViewModes[options[1]].icon;
		const Icon = value === options[0] ? IconB : IconA; // invert
		return (
			<button
				type={'button'}
				className={cn('btn btn-square join-item btn-sm', className)}
				onClick={() => onValueChange?.(value === options[0] ? options[1] : options[0])}
			>
				<Icon />
			</button>
		);
	}
	return (
		<div className={cn('group join', className)} data-value={value || null} {...props}>
			{options.map((mode) => {
				const Icon = ModeIcons[mode];
				return (
					<button
						key={mode}
						type={'button'}
						title={mode}
						className={cn(
							'btn btn-square join-item btn-sm',
							// 'group-data-[value=list]:btn-active',
							{ 'btn-active': value === mode },
						)}
						onClick={() => onValueChange?.(mode)}
					>
						{Icon ? <Icon /> : mode}
					</button>
				);
			})}
		</div>
	);
}
