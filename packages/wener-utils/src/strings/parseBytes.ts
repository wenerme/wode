const UnitMultipliers: Record<string, number> = {
	B: 1,
	// SI
	K: 1000,
	KB: 1000,
	M: 1000 ** 2,
	MB: 1000 ** 2,
	G: 1000 ** 3,
	GB: 1000 ** 3,
	T: 1000 ** 4,
	TB: 1000 ** 4,
	P: 1000 ** 5,
	PB: 1000 ** 5,
	E: 1000 ** 6,
	EB: 1000 ** 6,
	Z: 1000 ** 7,
	ZB: 1000 ** 7,
	Y: 1000 ** 8,
	YB: 1000 ** 8,
	// IEC
	KIB: 1024,
	MIB: 1024 ** 2,
	GIB: 1024 ** 3,
	TIB: 1024 ** 4,
	PIB: 1024 ** 5,
	EIB: 1024 ** 6,
	ZIB: 1024 ** 7,
	YIB: 1024 ** 8,
};

type ParseBytesResult = {
	bytes: number;
	unit: string;
	value: number;
};

export function parseBytes(str: string): ParseBytesResult | undefined {
	if (typeof str !== 'string' || str.length === 0) {
		return undefined;
	}

	const match = str.trim().match(/^([\d.]+)\s*([a-z]+)?$/i);
	if (!match) {
		return undefined;
	}

	const value = parseFloat(match[1]);
	let unit = (match[2] || 'B').toUpperCase();
	let multiplier = UnitMultipliers[unit];

	// Handle cases like G -> GB
	if (multiplier === undefined && unit.length === 1 && unit !== 'B') {
		unit += 'B';
		multiplier = UnitMultipliers[unit];
	}

	if (isNaN(value) || multiplier === undefined) {
		return undefined;
	}

	return {
		value,
		unit: match[2] || 'B',
		bytes: value * multiplier,
	};
}
