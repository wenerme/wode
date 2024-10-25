'use client';

import React, { type FC, type PropsWithChildren } from 'react';
import { Toaster } from 'react-hot-toast';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import duration from 'dayjs/plugin/duration';
import isToday from 'dayjs/plugin/isToday';
import relativeTime from 'dayjs/plugin/relativeTime';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { ThemeStateReactor } from '../../daisy';
import { useExposeDebug } from '../../hooks';

let init = false;

export const StaticRootReactor: FC<PropsWithChildren> = () => {
  useExposeDebug({ dayjs });
  if (!init) {
    init = true;
    setupDayjs();
  }

  return (
    <>
      <Toaster />
      <ThemeStateReactor />
    </>
  );
};

function setupDayjs() {
  dayjs.extend(relativeTime);
  dayjs.extend(duration);
  dayjs.extend(advancedFormat);
  dayjs.extend(isToday);
  dayjs.extend(dayOfYear);
  // dayjs.extend(quarterOfYear);
  // dayjs.extend(localeData);
  dayjs.extend(utc);
  dayjs.extend(timezone);
  dayjs.locale('zh-cn');
  dayjs.tz.setDefault('Asia/Shanghai');
  return dayjs;
}
