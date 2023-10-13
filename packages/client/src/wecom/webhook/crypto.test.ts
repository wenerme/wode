import { hex, sha1 } from '@wener/utils';
import { polyfillCrypto } from '@wener/utils/server';
import { XMLParser } from 'fast-xml-parser';
import { assert, test } from 'vitest';
import { createWechatWebhookHandler } from '../../wechat/webhook';

test('parse', async () => {
  const p = new XMLParser();
  const out = p.parse(`
<xml>
   <ToUserName><![CDATA[toUser]]></ToUserName>
   <FromUserName><![CDATA[fromUser]]></FromUserName> 
   <CreateTime>1348831860</CreateTime>
   <MsgType><![CDATA[text]]></MsgType>
   <Content><![CDATA[this is a test]]></Content>
   <MsgId>1234567890123456</MsgId>
   <AgentID>1</AgentID>
</xml>`);

  console.log(JSON.stringify(out.xml, null, 2));
});

test('crypto', async () => {
  // https://developer.work.weixin.qq.com/document/path/90968#%E6%B6%88%E6%81%AF%E4%BD%93%E7%AD%BE%E5%90%8D%E6%A0%A1%E9%AA%8C

  await polyfillCrypto();

  const corpId = 'wx5823bf96d3bd56c7';
  const token = 'QDG6eK';
  const encodingAesKey = 'jWmYm7qr5nMoAUwZRjGtBxmz3KA1tkAj3ykkR6q2B2C';

  const body = `<xml>
<ToUserName><![CDATA[wx5823bf96d3bd56c7]]></ToUserName>
<Encrypt><![CDATA[RypEvHKD8QQKFhvQ6QleEB4J58tiPdvo+rtK1I9qca6aM/wvqnLSV5zEPeusUiX5L5X/0lWfrf0QADHHhGd3QczcdCUpj911L3vg3W/sYYvuJTs3TUUkSUXxaccAS0qhxchrRYt66wiSpGLYL42aM6A8dTT+6k4aSknmPj48kzJs8qLjvd4Xgpue06DOdnLxAUHzM6+kDZ+HMZfJYuR+LtwGc2hgf5gsijff0ekUNXZiqATP7PF5mZxZ3Izoun1s4zG4LUMnvw2r+KqCKIw+3IQH03v+BCA9nMELNqbSf6tiWSrXJB3LAVGUcallcrw8V2t9EL4EhzJWrQUax5wLVMNS0+rUPA3k22Ncx4XXZS9o0MBH27Bo6BpNelZpS+/uh9KsNlY6bHCmJU9p8g7m3fVKn28H3KDYA5Pl/T8Z1ptDAVe0lXdQ2YoyyH2uyPIGHBZZIs2pDBS8R07+qN+E7Q==]]></Encrypt>
<AgentID><![CDATA[218]]></AgentID>
</xml>
`;
  let c = await createWechatWebhookHandler({ encodingAesKey, token, appId: corpId });
  const out = c.parse(body);

  {
    const msg_signature = '477715d11cdb4164915debcba66cb864d751f3e6';
    const timestamp = 1409659813;
    const nonce = 1372623149;
    const s = [token, timestamp, nonce, out.Encrypt];
    const sign = hex(await sha1(s.sort().join('')));
    assert.equal(sign, msg_signature);

    assert.isTrue(await c.verify({ timestamp, nonce, signature: msg_signature, message: out.Encrypt }));
  }

  console.log(out);
  let { appId, data, message } = await c.decrypt(out);
  console.log(data);
  assert.equal(corpId, appId);
});
