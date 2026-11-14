const RedirectStatuses = new Set([301, 302, 303, 307, 308]);

/**
 * 凭据请求的应用层重定向守卫。SDK 的 same-origin 还允许默认端口 HTTP → HTTPS，
 * 这里要求协议、主机和有效端口完全一致。先手动获取响应，再交给 SDK 跟随同源路径跳转。
 * SSE 的 GET/POST 和 Streamable HTTP 必须共用此 fetch，不能只保护建连请求。
 */
export const fetchWithStrictOrigin: typeof fetch = async (input, init) => {
	const response = await fetch(input, { ...init, redirect: 'manual' });
	const location = response.headers.get('location');
	if (!RedirectStatuses.has(response.status) || !location) return response;

	const from = new URL(input instanceof Request ? input.url : input);
	try {
		if (new URL(location, from).origin === from.origin) return response;
	} catch {
		// 无法解析的 Location 也不交给后续重定向逻辑。
	}
	await response.body?.cancel().catch(() => {});
	throw new Error('Redirect not followed: strict same-origin policy requires identical protocol, hostname and port');
};
