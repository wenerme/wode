export class SSE {
  static stringify(chunk: {
    id?: string | number;
    event?: string;
    data?: string;
    retry?: number;
    comment?: string;
  }): string {
    let payload = '';
    if (chunk.id) {
      payload += `id: ${chunk.id}\n`;
    }
    if (chunk.event) {
      payload += `event: ${chunk.event}\n`;
    }
    if (chunk.data) {
      payload += `data: ${typeof chunk.data === 'object' ? JSON.stringify(chunk.data) : chunk.data}\n`;
    }
    if (chunk.retry) {
      payload += `retry: ${chunk.retry}\n`;
    }
    if (chunk.comment) {
      payload += `:${chunk.comment}\n`;
    }
    if (!payload) {
      return '';
    }
    payload += '\n';
    return payload;
  }
}
