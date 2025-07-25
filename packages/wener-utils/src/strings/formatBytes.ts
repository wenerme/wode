type SIUnit = 'B' | 'kB' | 'MB' | 'GB' | 'TB' | 'PB' | 'EB' | 'ZB' | 'YB';
type IECUnit = 'B' | 'KiB' | 'MiB' | 'GiB' | 'TiB' | 'PiB' | 'EiB' | 'ZiB' | 'YiB';
type Unit = SIUnit | IECUnit;

interface FormatBytesOptions {
	/** True to use metric (SI) units (powers of 1000). Default is false (binary IEC, powers of 1024). */
	si?: boolean;
	/** Number of decimal places to display. Default is 1. */
	dp?: number;
	/** Force formatting to a specific unit. */
	unit?: Unit;
}

export function formatBytes(bytes: number, options?: FormatBytesOptions): string;
export function formatBytes(bytes: number, si?: boolean, dp?: number): string;
export function formatBytes(bytes: number, optionsOrSi: boolean | FormatBytesOptions = false, dp = 1): string {
	let options: FormatBytesOptions;
	if (typeof optionsOrSi === 'boolean') {
		options = { si: optionsOrSi, dp };
	} else {
		options = optionsOrSi || {};
	}

	const { si = false, dp: decimalPlaces = 1, unit: forceUnit } = options;
	const thresh = si ? 1000 : 1024;
	const units = si
		? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
		: ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];

	if (Math.abs(bytes) < thresh && !forceUnit) {
		return `${bytes} B`;
	}

	if (forceUnit && forceUnit !== 'B') {
		const unitIndex = units.findIndex((u) => u.toLowerCase() === forceUnit.toLowerCase());
		if (unitIndex !== -1) {
			const value = bytes / Math.pow(thresh, unitIndex + 1);
			return `${value.toFixed(decimalPlaces)} ${units[unitIndex]}`;
		}
	}

	let u = -1;
	const r = 10 ** decimalPlaces;

	do {
		bytes /= thresh;
		++u;
	} while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);

	return `${bytes.toFixed(decimalPlaces)} ${units[u]}`;
}
