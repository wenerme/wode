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
  const keyData = ArrayBuffers.fromBase64(sessionKey);
  const data = ArrayBuffers.from(encryptedData, 'base64');
  const ivBuffer = ArrayBuffers.from(iv, 'base64');

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
