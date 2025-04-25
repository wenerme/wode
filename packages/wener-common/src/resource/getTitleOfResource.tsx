export function getTitleOfResource(res?: any): string | undefined {
	if (res && typeof res === 'object') {
		return res.displayName || res.title || res.fullName || res.loginName || res.topic || res.code;
	}
	return undefined;
}
