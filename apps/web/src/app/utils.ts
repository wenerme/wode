import { headers } from 'next/headers';

export async function getServerUrl() {
  const hdr = await headers();
  return hdr.get('x-url');
}

export async function getServerRequestPath() {
  let url = await getServerUrl();
  if (url) {
    try {
      return new URL(url).pathname;
    } catch (e) {}
  }
}
