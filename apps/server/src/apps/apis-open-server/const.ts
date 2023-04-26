export function getServerUrl(path?: string) {
  return new URL(process.env.SERVER_URL || 'https://apis.wener.me', path);
}
