import { ArrayBuffers } from '@wener/utils';

export async function decryptData({
	appId,
	sessionKey,
	encryptedData,
	iv,
}: {
	appId: string;
	sessionKey: string;
	encryptedData: string;
	iv: string;
}) {
	const keyData = new Uint8Array(ArrayBuffers.fromBase64(sessionKey));
	const data = new Uint8Array(ArrayBuffers.fromBase64(encryptedData));
	const ivBuffer = new Uint8Array(ArrayBuffers.fromBase64(iv));

	const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'AES-CBC', length: 128 }, false, ['decrypt']);

	const decryptedData = await crypto.subtle.decrypt({ name: 'AES-CBC', iv: ivBuffer }, cryptoKey, data);

	const decoder = new TextDecoder();
	const decryptedText = decoder.decode(decryptedData);
	const decryptedObject = JSON.parse(decryptedText);

	if (decryptedObject.watermark.appid !== appId) {
		throw new Error('Illegal Buffer');
	}

	return decryptedObject;
}
