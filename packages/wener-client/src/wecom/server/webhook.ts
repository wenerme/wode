import { type FetchLike } from '@wener/utils';
import { request } from './request';
import { type SendWebhookRequest } from './types';

export class WebhookClient {
  constructor(readonly options: { key: string; fetch?: FetchLike }) {}

  async sendMessage(body: SendWebhookRequest) {
    const { key, fetch } = this.options;
    return request({
      url: '/cgi-bin/webhook/send',
      params: { key },
      body,
      fetch,
    });
  }

  /**
   * @param type 普通文件(file)：文件大小不超过20M; 语音(voice)：文件大小不超过2M，播放长度不超过60s，仅支持AMR格式
   */
  async uploadMedia({ type, blob }: { type: 'file' | 'voice'; blob: Blob }) {
    const { key, fetch } = this.options;
    // multipart/form-data
    const formData = new FormData();
    formData.append('media', blob);
    return request<{
      type: string;
      media_id: string; // 3 天有效
      created_at: string;
    }>({
      url: '/cgi-bin/webhook/media/upload',
      params: { type, key },
      body: formData,
      fetch,
    });
  }
}
