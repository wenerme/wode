import { type OpUnitType, type UnitTypeLongPlural } from 'dayjs';
import { type Duration } from 'dayjs/plugin/duration';
import { parseDuration } from './parseDuration';

type FormatDurationOptions = {
	humanize?: boolean;
	format?: string | 'human' | 'humanize' | 'iso' | 'auto';
	iso?: boolean;
};

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

export function formatDuration(value: MaybeDuration, o?: FormatDurationOptions): string | undefined {
	const v = parseDuration(value);
	if (v === undefined || v === null) {
		return;
	}

	let { format, humanize, iso } = o || {};
	// Use local variables instead of modifying o directly
	switch (format) {
		case 'human':
		case 'humanize':
			humanize = true;
			format = undefined;
			break;
		case 'iso':
			iso = true;
			format = undefined;
			break;
		case 'auto':
			format = undefined;
			break;
	}

	if (humanize) {
		return v.humanize();
	}
	if (iso) {
		return v.toISOString();
	}
	if (format) {
		return v.format(format);
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
}
