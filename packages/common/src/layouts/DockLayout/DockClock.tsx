import React, { memo, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useInterval } from '@wener/reaction';

export const DockClock = memo(() => {
  const [date, setDate] = useState(() => dayjs());
  useInterval(() => setDate(dayjs()), 1000 * 60);
  const title = useMemo(
    () => new Intl.DateTimeFormat('zh-CN', { calendar: 'chinese', dateStyle: 'full' }).format(date.toDate()),
    [date.dayOfYear()],
  );
  return (
    <div className={'self-center flex flex-col items-center'} title={title}>
      <span style={{ fontSize: 10 }}>{date.format('ddd hh:mm')}</span>
      <span style={{ fontSize: 9 }}>{date.format('YYYY/MM/DD')}</span>
    </div>
  );
});
DockClock.displayName = 'DockClock';
