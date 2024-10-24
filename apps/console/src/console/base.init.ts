import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import duration from 'dayjs/plugin/duration';
import isToday from 'dayjs/plugin/isToday';
import relativeTime from 'dayjs/plugin/relativeTime';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { defineInit } from '@/utils/init/defineInit';
import 'dayjs/locale/en';
import 'dayjs/locale/zh';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/zh-hk';
import 'dayjs/locale/zh-tw';
import React from 'react';

export const EnvironmentInit = defineInit({
  name: 'Environment',
  onInit: () => {
    // avoid potential dependency
    window.React ||= React;
  },
});

export const DayJSInit = defineInit({
  name: 'DayJS',
  onInit: () => {
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
  },
});
