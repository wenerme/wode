import { getGlobalStates } from '@wener/utils';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import duration from 'dayjs/plugin/duration';
import isToday from 'dayjs/plugin/isToday';
import localeData from 'dayjs/plugin/localeData';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import relativeTime from 'dayjs/plugin/relativeTime';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

export function setupDayjs() {
  return getGlobalStates('dayjs', () => {
    dayjs.extend(relativeTime);
    dayjs.extend(duration);
    dayjs.extend(advancedFormat);
    dayjs.extend(isToday);
    dayjs.extend(dayOfYear);
    dayjs.extend(quarterOfYear);
    dayjs.extend(localeData);
    dayjs.extend(utc);
    dayjs.extend(timezone);
    dayjs.locale('zh-cn');
    dayjs.tz.setDefault('Asia/Shanghai');
    return dayjs;
  });
}
