import React, { type ComponentType } from 'react';
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
import { flexRender, type FlexRenderable } from '@wener/reaction';
import { cn } from '../tw';

export type ViewMode =
  | 'calendar'
  | 'chart'
  | 'gallery'
  | 'grid'
  | 'kanban'
  | 'list'
  | 'map'
  | 'table'
  | 'timeline'
  | 'tree';

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
};

type ViewModeOption =
  | ViewMode
  | {
      value: ViewMode;
      label: string;
    };

const AllViewMode = [
  { value: 'calendar', label: '日历' },
  { value: 'chart', label: '图表' },
  { value: 'gallery', label: '画廊' },
  { value: 'grid', label: '网格' },
  { value: 'kanban', label: '看板' },
  { value: 'list', label: '列表' },
  { value: 'map', label: '地图' },
  { value: 'table', label: '表格' },
  { value: 'timeline', label: '时间线' },
  { value: 'tree', label: '树状图' },
];

export function ViewModeInput<T extends ViewMode>({ value, onValueChange, options = [] }: ViewModeInputProps<T>) {
  if (options.length < 2) {
    return null;
  }

  if (options.length === 2) {
    const IconA = ModeIcons[options[0]];
    const IconB = ModeIcons[options[1]];

    return (
      <label className='swap'>
        <input type='checkbox' checked={value === options[0]} />
        <IconA />
        <IconB />
      </label>
    );
  }
  return (
    <div className={'group join'} data-value={value || null}>
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

export const ViewModeRenderer = ({
  views,
  useViewMode,
  viewMode = useViewMode?.(),
}: {
  views?: Partial<Record<ViewMode, FlexRenderable<any>>>;
  viewMode?: ViewMode;
  useViewMode?: () => ViewMode | undefined;
}) => {
  if (!viewMode) return null;
  return flexRender(views?.[viewMode], {});
};
