export function withBasePath(s?: undefined): undefined;
export function withBasePath(s: string): string;
export function withBasePath(s?: string) {
  if (s === undefined || s === null || /^https?:/.test(s)) return s;
  return getBasePath() + s;
}

export function getBasePath() {
  let maybe = process.env.NEXT_PUBLIC_BASE_PATH || process.env.BASE_PATH;
  if (!globalThis.window) {
    const { NEXT_PUBLIC_BASE_PATH, BASE_PATH } = process.env;
    maybe = NEXT_PUBLIC_BASE_PATH || BASE_PATH;
  }
  return maybe || '';
}

export function getBaseUrl() {
  let maybe = process.env.NEXT_PUBLIC_BASE_URL;
  if (!globalThis.window) {
    ({ NEXT_PUBLIC_BASE_URL: maybe } = process.env);
  }
  return maybe || getOriginUrl() + getBasePath();
}

export function getAuthBaseUrl() {
  let maybe = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_NEXTAUTH_URL;
  if (!globalThis.window) {
    const { NEXTAUTH_URL, NEXT_PUBLIC_NEXTAUTH_URL } = process.env;
    maybe = NEXTAUTH_URL || NEXT_PUBLIC_NEXTAUTH_URL;
  }
  return maybe || getBaseUrl() + '/api/auth';
}

export function getInternalAuthBaseUrl() {
  let maybe = process.env.NEXTAUTH_INTERNAL_URL;
  if (!globalThis.window) {
    ({ NEXTAUTH_INTERNAL_URL: maybe } = process.env);
  }
  return maybe || getAuthBaseUrl();
}

export function getOriginUrl() {
  if (globalThis.window) return window.location.origin;

  const { NEXT_PUBLIC_URL, VERCEL_URL, RENDER_INTERNAL_HOSTNAME, PORT = 3000 } = process.env;
  if (NEXT_PUBLIC_URL) return NEXT_PUBLIC_URL;
  if (VERCEL_URL) return `https://${VERCEL_URL}`;
  if (RENDER_INTERNAL_HOSTNAME) return `http://${RENDER_INTERNAL_HOSTNAME}:${PORT}`;

  return `http://127.0.0.1:${PORT}`;
}
