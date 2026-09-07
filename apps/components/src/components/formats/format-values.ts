'use client';

export type FormatLocale = string | string[];
export type EmptyFormatValue = null | undefined | '';
export type NumberInput = number | string | bigint | EmptyFormatValue;
export type DateInput = Date | number | string | EmptyFormatValue;
export type BooleanInput = boolean | string | number | EmptyFormatValue;

export type FormatFallbackOptions = {
	fallback?: string;
};

export type FormatNumberOptions = Intl.NumberFormatOptions &
	FormatFallbackOptions & {
		locale?: FormatLocale;
	};

export type FormatCurrencyOptions = Omit<FormatNumberOptions, 'style'> & {
	currency?: string;
};

export type FormatPercentOptions = Omit<FormatNumberOptions, 'style'> & {
	input?: 'ratio' | 'percent';
};

export type FormatBytesOptions = FormatFallbackOptions & {
	/** Defaults to 1000 for decimal labels and 1024 for binary labels. */
	base?: 1000 | 1024;
	binary?: boolean;
	maximumFractionDigits?: number;
	minimumFractionDigits?: number;
};

export type DurationInput =
	| number
	| string
	| EmptyFormatValue
	| Partial<Record<'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds', number>>
	| {
			value: number | string;
			unit?: DurationUnit;
	  };

export type DurationUnit = 'millisecond' | 'second' | 'minute' | 'hour' | 'day';
export type DurationStyle = 'compact' | 'digital' | 'iso';

export type FormatDurationOptions = FormatFallbackOptions & {
	style?: DurationStyle;
	unit?: DurationUnit;
	maxParts?: number;
	showZero?: boolean;
};

export type FormatDateTimeOptions = Intl.DateTimeFormatOptions &
	FormatFallbackOptions & {
		locale?: FormatLocale;
	};

export type FormatRelativeTimeOptions = FormatFallbackOptions & {
	locale?: FormatLocale;
	now?: DateInput;
	numeric?: Intl.RelativeTimeFormatNumeric;
	style?: Intl.RelativeTimeFormatStyle;
};

export type FormatPhoneNumberOptions = FormatFallbackOptions & {
	mask?: boolean;
	separator?: string;
};

const defaultFallback = '—';
const durationUnitMs: Record<DurationUnit, number> = {
	millisecond: 1,
	second: 1000,
	minute: 60_000,
	hour: 3_600_000,
	day: 86_400_000,
};

export function isEmptyFormatValue(value: unknown): value is EmptyFormatValue {
	return value === null || value === undefined || value === '';
}

export function parseFiniteNumber(value: NumberInput): number | undefined {
	if (isEmptyFormatValue(value)) return undefined;
	if (typeof value === 'bigint') {
		const numberValue = Number(value);
		return Number.isSafeInteger(numberValue) ? numberValue : undefined;
	}
	if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
	const trimmed = value.trim();
	if (!trimmed) return undefined;
	const parsed = Number(trimmed.replace(/,/g, ''));
	return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseDateValue(value: DateInput): Date | undefined {
	if (isEmptyFormatValue(value)) return undefined;
	const date = value instanceof Date ? value : new Date(value);
	return Number.isFinite(date.getTime()) ? date : undefined;
}

export function formatNumber(
	value: NumberInput,
	{ locale, fallback = defaultFallback, ...options }: FormatNumberOptions = {},
) {
	const numberValue = parseFiniteNumber(value);
	if (numberValue === undefined) return fallback;
	return safeFormat(fallback, () => new Intl.NumberFormat(locale, options).format(numberValue));
}

export function formatDecimal(
	value: NumberInput,
	{ minimumFractionDigits = 2, maximumFractionDigits = 2, ...options }: FormatNumberOptions = {},
) {
	return formatNumber(value, { minimumFractionDigits, maximumFractionDigits, ...options });
}

export function formatCurrency(
	value: NumberInput,
	{ locale, currency = 'CNY', fallback = defaultFallback, ...options }: FormatCurrencyOptions = {},
) {
	const numberValue = parseFiniteNumber(value);
	if (numberValue === undefined) return fallback;
	return safeFormat(fallback, () =>
		new Intl.NumberFormat(locale, { currency, style: 'currency', ...options }).format(numberValue),
	);
}

export function formatPercent(
	value: NumberInput,
	{
		locale,
		input = 'ratio',
		fallback = defaultFallback,
		maximumFractionDigits = 2,
		...options
	}: FormatPercentOptions = {},
) {
	const numberValue = parseFiniteNumber(value);
	if (numberValue === undefined) return fallback;
	return safeFormat(fallback, () =>
		new Intl.NumberFormat(locale, {
			maximumFractionDigits,
			style: 'percent',
			...options,
		}).format(input === 'percent' ? numberValue / 100 : numberValue),
	);
}

export function formatBytes(
	value: NumberInput,
	{
		base,
		binary = false,
		fallback = defaultFallback,
		maximumFractionDigits = 2,
		minimumFractionDigits = 0,
	}: FormatBytesOptions = {},
) {
	const numberValue = parseFiniteNumber(value);
	if (numberValue === undefined) return fallback;
	if (numberValue === 0) return '0 B';
	const sign = numberValue < 0 ? '-' : '';
	const absolute = Math.abs(numberValue);
	const scaleBase = base ?? (binary ? 1024 : 1000);
	const units = binary ? ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'] : ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
	const unitIndex = Math.min(units.length - 1, Math.floor(Math.log(absolute) / Math.log(scaleBase)));
	const scaled = absolute / scaleBase ** unitIndex;
	const formatted = safeFormat(fallback, () =>
		new Intl.NumberFormat('en-US', {
			maximumFractionDigits: unitIndex === 0 ? 0 : maximumFractionDigits,
			minimumFractionDigits: unitIndex === 0 ? 0 : minimumFractionDigits,
		}).format(scaled),
	);
	return formatted === fallback ? fallback : `${sign}${formatted} ${units[unitIndex]}`;
}

export function parseDurationMilliseconds(value: DurationInput, defaultUnit: DurationUnit = 'millisecond') {
	if (isEmptyFormatValue(value)) return undefined;
	if (typeof value === 'number') return value * durationUnitMs[defaultUnit];
	if (typeof value === 'string') {
		const numberValue = parseFiniteNumber(value);
		if (numberValue !== undefined) return numberValue * durationUnitMs[defaultUnit];
		return parseIsoDurationMilliseconds(value);
	}
	if ('value' in value) {
		const numberValue = parseFiniteNumber(value.value);
		return numberValue === undefined ? undefined : numberValue * durationUnitMs[value.unit ?? defaultUnit];
	}
	let total = 0;
	for (const [unit, amount] of Object.entries(value) as Array<
		['days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds', number | undefined]
	>) {
		if (amount === undefined) continue;
		if (!Number.isFinite(amount)) return undefined;
		const normalized = unit.slice(0, -1) as DurationUnit;
		total += amount * durationUnitMs[normalized];
	}
	return total;
}

export function formatDuration(
	value: DurationInput,
	{
		style = 'compact',
		unit = 'millisecond',
		fallback = defaultFallback,
		maxParts = 2,
		showZero = true,
	}: FormatDurationOptions = {},
) {
	const milliseconds = parseDurationMilliseconds(value, unit);
	if (milliseconds === undefined) return fallback;
	const sign = milliseconds < 0 ? '-' : '';
	let remaining = Math.abs(milliseconds);
	if (style === 'iso') return `${sign}${toIsoDuration(remaining)}`;
	if (style === 'digital') return `${sign}${toDigitalDuration(remaining)}`;

	const parts: string[] = [];
	const units: Array<[label: string, size: number]> = [
		['d', durationUnitMs.day],
		['h', durationUnitMs.hour],
		['m', durationUnitMs.minute],
		['s', durationUnitMs.second],
		['ms', durationUnitMs.millisecond],
	];
	for (const [label, size] of units) {
		const amount = Math.floor(remaining / size);
		if (amount > 0) {
			parts.push(`${amount}${label}`);
			remaining -= amount * size;
		}
		if (parts.length >= maxParts) break;
	}
	if (parts.length === 0 && showZero) return '0ms';
	return `${sign}${parts.join('') || fallback}`;
}

export function formatDateTime(
	value: DateInput,
	{ locale, fallback = defaultFallback, ...options }: FormatDateTimeOptions = {},
) {
	const date = parseDateValue(value);
	if (!date) return fallback;
	return safeFormat(fallback, () => new Intl.DateTimeFormat(locale, options).format(date));
}

export function formatDate(value: DateInput, options: FormatDateTimeOptions = {}) {
	return formatDateTime(value, { dateStyle: 'medium', ...options });
}

export function formatTime(value: DateInput, options: FormatDateTimeOptions = {}) {
	return formatDateTime(value, { timeStyle: 'short', ...options });
}

export function formatRelativeTime(
	value: DateInput,
	{
		locale,
		now = Date.now(),
		numeric = 'auto',
		style = 'short',
		fallback = defaultFallback,
	}: FormatRelativeTimeOptions = {},
) {
	const date = parseDateValue(value);
	const nowDate = parseDateValue(now);
	if (!date || !nowDate) return fallback;
	const diffMs = date.getTime() - nowDate.getTime();
	const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
		['year', 31_536_000_000],
		['month', 2_592_000_000],
		['week', 604_800_000],
		['day', 86_400_000],
		['hour', 3_600_000],
		['minute', 60_000],
		['second', 1000],
	];
	const [relativeUnit, unitMs] = units.find(([, size]) => Math.abs(diffMs) >= size) ?? ['second', 1000];
	const amount = Math.round(diffMs / unitMs);
	return safeFormat(fallback, () =>
		new Intl.RelativeTimeFormat(locale, { numeric, style }).format(amount, relativeUnit),
	);
}

export function getRelativeTimeUpdateInterval(value: DateInput, now: number = Date.now()) {
	const date = parseDateValue(value);
	if (!date) return 0;
	const distance = Math.abs(date.getTime() - now);
	if (distance < 60_000) return 1000;
	if (distance < 3_600_000) return 60_000;
	if (distance < 86_400_000) return 300_000;
	return 1_800_000;
}

export function formatBoolean(
	value: BooleanInput,
	{
		trueText = '是',
		falseText = '否',
		fallback = defaultFallback,
	}: FormatFallbackOptions & { trueText?: string; falseText?: string } = {},
) {
	if (isEmptyFormatValue(value)) return fallback;
	if (typeof value === 'boolean') return value ? trueText : falseText;
	if (typeof value === 'number') return value === 0 ? falseText : trueText;
	const normalized = value.trim().toLowerCase();
	if (!normalized) return fallback;
	if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) return trueText;
	if (['false', '0', 'no', 'n', 'off'].includes(normalized)) return falseText;
	return fallback;
}

export function formatPhoneNumber(
	value: string | EmptyFormatValue,
	{ mask = true, separator = ' ', fallback = defaultFallback }: FormatPhoneNumberOptions = {},
) {
	if (isEmptyFormatValue(value)) return fallback;
	const compact = value.replace(/\D/g, '');
	if (!compact) return fallback;
	if (compact.length === 11) {
		const head = compact.slice(0, 3);
		const middle = mask ? '****' : compact.slice(3, 7);
		const tail = compact.slice(7);
		return [head, middle, tail].join(separator);
	}
	if (!mask) return compact;
	if (compact.length <= 7) return compact;
	return `${compact.slice(0, 3)}${'*'.repeat(Math.max(3, compact.length - 7))}${compact.slice(-4)}`;
}

function parseIsoDurationMilliseconds(value: string) {
	const match = value
		.trim()
		.match(/^(-)?P(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i);
	if (!match) return undefined;
	const [, negative, days = '0', hours = '0', minutes = '0', seconds = '0'] = match;
	const total =
		Number(days) * durationUnitMs.day +
		Number(hours) * durationUnitMs.hour +
		Number(minutes) * durationUnitMs.minute +
		Number(seconds) * durationUnitMs.second;
	return negative ? -total : total;
}

function safeFormat(fallback: string, callback: () => string) {
	try {
		return callback();
	} catch {
		return fallback;
	}
}

function toDigitalDuration(milliseconds: number) {
	const totalSeconds = Math.floor(milliseconds / 1000);
	const ms = Math.floor(milliseconds % 1000);
	const seconds = totalSeconds % 60;
	const totalMinutes = Math.floor(totalSeconds / 60);
	const minutes = totalMinutes % 60;
	const hours = Math.floor(totalMinutes / 60);
	const main = hours > 0 ? `${hours}:${pad2(minutes)}:${pad2(seconds)}` : `${minutes}:${pad2(seconds)}`;
	return ms > 0 ? `${main}.${String(ms).padStart(3, '0')}` : main;
}

function toIsoDuration(milliseconds: number) {
	let remaining = Math.floor(milliseconds);
	const days = Math.floor(remaining / durationUnitMs.day);
	remaining -= days * durationUnitMs.day;
	const hours = Math.floor(remaining / durationUnitMs.hour);
	remaining -= hours * durationUnitMs.hour;
	const minutes = Math.floor(remaining / durationUnitMs.minute);
	remaining -= minutes * durationUnitMs.minute;
	const seconds = Math.floor(remaining / durationUnitMs.second);
	remaining -= seconds * durationUnitMs.second;
	const secondText = remaining > 0 ? `${seconds}.${String(remaining).padStart(3, '0')}S` : `${seconds}S`;
	const datePart = days > 0 ? `${days}D` : '';
	const timePart =
		hours || minutes || seconds || remaining
			? `T${hours ? `${hours}H` : ''}${minutes ? `${minutes}M` : ''}${secondText}`
			: '';
	return `P${datePart}${timePart || 'T0S'}`;
}

function pad2(value: number) {
	return String(value).padStart(2, '0');
}
