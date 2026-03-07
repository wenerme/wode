import type { OpUnitType, UnitTypeLongPlural } from 'dayjs';
import type { Duration } from 'dayjs/plugin/duration';
import { formatNumber } from '../utils/formatNumber';
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
	if (v.asDays() > 1) {
		let s = v.toISOString();
		return s.replace('P', '').replace('T', '').toLowerCase();
	}

	{
		const parts: string[] = [];
		const h = v.hours();
		const m = v.minutes();
		const s = v.seconds();
		const ms = v.milliseconds();

		if (h > 0) {
			parts.push(`${h}h`);
		}
		if (m > 0) {
			parts.push(`${m}m`);
		}
		if (s > 0) {
			parts.push(`${s}s`);
		}
		if (ms > 0 || parts.length === 0) {
			parts.push(`${formatNumber(ms, 2)}ms`);
		}
		return parts.join('');
	}
}
