import type { OpUnitType, UnitTypeLongPlural } from 'dayjs';
import type { Duration } from 'dayjs/plugin/duration';
import { dayjs } from './dayjs';

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

export function parseDuration(value: MaybeDuration): Duration | undefined {
	if (!value && value !== 0) {
		return;
	}
	let duration: Duration;
	if (typeof value === 'number') {
		duration = dayjs.duration(value);
	} else if (typeof value === 'string' && value.startsWith('P')) {
		// PT0S
		duration = dayjs.duration(value);
	} else if (typeof value === 'object' && 'value' in value) {
		duration = dayjs.duration(value.value, value.unit);
	} else if (dayjs.isDuration(value)) {
		duration = value;
	} else if (typeof value === 'object') {
		duration = dayjs.duration(value);
	} else {
		console.warn(`Invalid duration value:`, value);
		return;
	}
	return duration;
}
