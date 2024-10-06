import React, { memo, useMemo, useRef, useState } from 'react';
import { ClockWidget } from '@wener/console/console/applets';
import type { ReactWindow } from '@wener/console/web/window';
import { useInterval } from '@wener/reaction';
import dayjs from 'dayjs';

export const DockClock = memo(() => {
  const [date, setDate] = useState(() => dayjs());
  useInterval(() => {
    setDate(dayjs());
  }, 1000 * 60);
  const title = useMemo(
    () => new Intl.DateTimeFormat('zh-CN', { calendar: 'chinese', dateStyle: 'full' }).format(date.toDate()),
    [date.dayOfYear()],
  );

  const winRef = useRef<ReactWindow>();
  return (
    <div
      className={'flex flex-col items-center self-center'}
      title={title}
      onClick={() => {
        ClockWidget.toggle();
      }}
    >
      <span style={{ fontSize: 10 }}>{date.format('ddd hh:mm')}</span>
      <span style={{ fontSize: 9 }}>{date.format('YYYY/MM/DD')}</span>
    </div>
  );
});
DockClock.displayName = 'DockClock';
