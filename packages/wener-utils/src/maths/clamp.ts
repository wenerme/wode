export function clamp<T>(
	value: T | null | undefined,
	min: T | null | undefined,
	max: T | null | undefined,
	def?: T,
): T {
	if (value == null) {
		return def ?? min!;
	}
	if (min != null && value < min) {
		return min;
	}
	if (max != null && value > max) {
		return max;
	}
	return value;
}
