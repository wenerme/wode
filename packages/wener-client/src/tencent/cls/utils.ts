export function isTopicId(str: string) {
	if (!str) return false;
	// uuid like
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(str);
}
