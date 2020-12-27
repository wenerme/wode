export function download(filename: string, data: any, { type = 'application/octet-stream', raw = false } = {}) {
  const a = document.createElement('a');
  let closer: () => void = () => null;
  try {
    a.download = filename;

    // console.info(`downloading ${name}`, data);

    // url or data url
    if (typeof data === 'string' && /^(https?:|data:)/.test(data) && !raw) {
      a.href = data;
    } else if (typeof data === 'string') {
      data = new TextEncoder().encode(data);
    }

    if (data instanceof Uint8Array) {
      data = new Blob([data], { type });
    }

    if (data instanceof File || data instanceof Blob || data instanceof MediaSource) {
      a.href = URL.createObjectURL(data);
      closer = () => URL.revokeObjectURL(a.href);
    } else {
      console.error(`invalid download data`, data);
      throw new Error(`can not download ${Object.getPrototypeOf(data)}`);
    }
    a.click();
  } finally {
    closer();
  }
}
