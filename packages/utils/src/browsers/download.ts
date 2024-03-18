/**
 * Trigger browser download
 * @param filename download as filename
 * @param data data or url to download
 * @param type content type
 * @param raw if true, data is treated as raw data, not url
 */
export async function download(filename: string, data: any, { type = 'application/octet-stream', raw = false } = {}) {
  const a = document.createElement('a');
  let closer: () => void = () => null;
  try {
    a.download = filename;

    // url or data url
    if (typeof data === 'string' && /^(https?:|data:)/.test(data) && !raw) {
      a.href = data;
      // 只有 same-origin 才能 download
      if (/^https?:/.test(data)) {
        if (new URL(data).origin !== location.origin) {
          // 非同源
          a.href = '';
          data = await fetch(data).then((res) => res.blob());
        }
      }
    } else if (typeof data === 'string') {
      data = new TextEncoder().encode(data);
    }

    if (data instanceof Uint8Array) {
      data = new Blob([data], { type });
    }
    {
      if (data instanceof File || data instanceof Blob || data instanceof MediaSource) {
        a.href = URL.createObjectURL(data);
        closer = () => {
          URL.revokeObjectURL(a.href);
        };
      } else {
        console.error(`invalid download data`, data);
        throw new Error(`can not download ${data && Object.getPrototypeOf(data)}`);
      }
      a.click();
    }
  } finally {
    closer();
  }
}
