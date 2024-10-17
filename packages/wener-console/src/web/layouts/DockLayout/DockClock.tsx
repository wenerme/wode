import { memo, useMemo, useState } from 'react';
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
  return (
    <div className={'flex flex-col items-center self-center'} title={title}>
      <span style={{ fontSize: 10 }}>{date.format('ddd hh:mm')}</span>
      <span style={{ fontSize: 9 }}>{date.format('YYYY/MM/DD')}</span>
    </div>
  );
});
DockClock.displayName = 'DockClock';
