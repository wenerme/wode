import { getGlobalThis } from '../../web/getGlobalThis';

export async function polyfillCrypto() {
	const globalObject = getGlobalThis();
	if ('crypto' in globalObject) {
		return false;
	}
	(globalObject as any).crypto = (await import('node:crypto')).webcrypto as unknown as Crypto;
	return true;
}
