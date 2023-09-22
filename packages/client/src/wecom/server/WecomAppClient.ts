import { GetJsApiTicketResponse } from './WecomCorpClient';
import { RequestOptions } from './request';

export class WecomAppClient {
  /**
   * https://qyapi.weixin.qq.com/cgi-bin/ticket/get?access_token=ACCESS_TOKEN&type=agent_config
   */
  getJsApiTicket() {
    return this.request<GetJsApiTicketResponse>({
      url: '/cgi-bin/ticket/get',
      params: {
        access_token: true,
        type: 'agent_config',
      },
    });
  }

  request<T>(_: RequestOptions<T>): Promise<T> {
    throw new Error('TODO');
  }
}
