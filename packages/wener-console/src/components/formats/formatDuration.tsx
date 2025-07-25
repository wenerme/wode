import { parseDuration } from '@wener/common/dayjs';
import type { OpUnitType, UnitTypeLongPlural } from 'dayjs';
import dayjs from 'dayjs';
import type { Duration } from 'dayjs/plugin/duration';
import duration from 'dayjs/plugin/duration';
import { omit } from 'es-toolkit';

type FormatDurationOptions = {
	humanize?: boolean;
	format?: string | 'human' | 'humanize' | 'iso' | 'auto';
	iso?: boolean;
};

dayjs.extend(duration);

export type MaybeDuration =
	| number
	| string
	| Duration
	| Partial<{
			[unit in Exclude<UnitTypeLongPlural, 'dates'> | 'weeks']: number;
	  }>
	| {
			value: number;
			unit?: Exclude<OpUnitType, 'date' | 'dates'>;
	  }
	| undefined
	| null;

export { parseDuration };

export function formatDuration(value: MaybeDuration, opts?: FormatDurationOptions): string | undefined;
/**
 * @deprecated
 */
export function formatDuration(
	opts: FormatDurationOptions & {
		value: MaybeDuration;
		unit?: Exclude<OpUnitType, 'date' | 'dates'>;
	},
): string | undefined;
export function formatDuration(_val: any, _o?: any): string | undefined {
	let value: MaybeDuration;
	let o: FormatDurationOptions = {};
	if ('value' in _val || 'unit' in _val) {
		value = _val;
		if (_val.unit) {
			value = {
				value: _val.value,
				unit: _val.unit,
			};
		}
		if (_o === undefined) {
			o = omit(_val, ['value', 'unit']);
		}
	} else {
		value = _val.value;
		o = { ..._o };
	}

	const v = parseDuration(value);
	if (!v) {
		return;
	}

	switch (o.format) {
		case 'human':
		case 'humanize':
			o.humanize = true;
			o.format = undefined;
			break;
		case 'iso':
			o.iso = true;
			o.format = undefined;
			break;
		case 'auto':
			o.format = undefined;
			break;
	}

	if (o.humanize) {
		return v.humanize();
	}
	if (o.iso) {
		return v.toISOString();
	}
	if (o.format) {
		return v.format(o.format);
	}

	// auto format

	// 1h2m3s
	if (v.asDays() > 1) {
		let s = v.toISOString();
		return s.replace('P', '').replace('T', '').toLowerCase();
	}

	{
		let parts: string[] = [];
		let h = v.hours();
		let m = v.minutes();
		let s = v.seconds();
		let ms = v.milliseconds();

		if (h > 0) {
			parts.push(`${h}h`);
		}
		if (m > 0) {
			parts.push(`${m}m`);
		}
		if (s > 0) {
			parts.push(`${s}s`);
		}
		if (ms > 0 || (h === 0 && m === 0 && s === 0)) {
			parts.push(`${ms}ms`);
		}
		return parts.join('');
	}

	// const s = v.asSeconds();
	// if (s < 60) {
	//   return v.format('ss[s]');
	// } else if (s < 60 * 60) {
	//   return v.format('mm:ss');
	// } else if (s < 60 * 60 * 24) {
	//   return v.format('HH:mm:ss');
	// }
	// const d = v.asDays();
	// return `${Math.floor(d)}d ${v.format('HH:mm:ss')}`;
}
