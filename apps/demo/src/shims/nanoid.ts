export const nanoid = (t = 21): string =>
  globalThis.crypto
    .getRandomValues(new Uint8Array(t))
    .reduce(
      (t, e) =>
        (t += (e &= 63) < 36 ? e.toString(36) : e < 62 ? (e - 26).toString(36).toUpperCase() : e < 63 ? '_' : '-'),
      '',
    );
