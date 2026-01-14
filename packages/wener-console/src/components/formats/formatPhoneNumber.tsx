export function formatPhoneNumber(
	value: string | null | undefined,
	{
		mask,
	}: {
		mask?: boolean;
	} = {},
) {
	if (!value) {
		return '';
	}
	if (mask) {
		return `${value.slice(0, 3)}****${value.slice(-3)}`;
	}
	return value;
}
