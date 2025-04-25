import { defineInit } from '@wener/common/meta';

export const LibInit = defineInit({
	name: 'Lib',
	onInit: async () => {
		{
			const { default: dayjs } = await import('dayjs');
			const { default: advancedFormat } = await import('dayjs/plugin/advancedFormat');
			const { default: dayOfYear } = await import('dayjs/plugin/dayOfYear');
			const { default: duration } = await import('dayjs/plugin/duration');
			const { default: isToday } = await import('dayjs/plugin/isToday');
			const { default: relativeTime } = await import('dayjs/plugin/relativeTime');
			const { default: timezone } = await import('dayjs/plugin/timezone');
			const { default: utc } = await import('dayjs/plugin/utc');

			await import('dayjs/locale/en');
			await import('dayjs/locale/zh');
			await import('dayjs/locale/zh-cn');
			await import('dayjs/locale/zh-hk');
			await import('dayjs/locale/zh-tw');

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
		}

		{
			const { setDefaultOptions } = await import('date-fns');
			const { zhCN } = await import('date-fns/locale/zh-CN');
			setDefaultOptions({ locale: zhCN });
		}

		// {
		// 	const { FormatRegistry } = await import('@sinclair/typebox');
		// 	FormatRegistry.Set('date', (v: string) => {
		// 		if (v) {
		// 			return /^\d{4}-\d{1,2}-\d{1,2}$/.test(v);
		// 		}
		// 		return true;
		// 	});
		// 	// FormatRegistry.Set('emoji', value => /<a?:.+?:\d{18}>|\p{Extended_Pictographic}/gu.test(value))
		// }
	},
});
