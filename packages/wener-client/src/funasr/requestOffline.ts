import { createLazyPromise, randomUUID, timeout } from '@wener/utils';
import { OfflineRequestMessage, OfflineResponseMessage } from './types';

function toSrt(msg: OfflineResponseMessage) {
  if (!msg.stamp_sents) {
    return '';
  }
  let out: string[] = [];
  let n = 0;
  for (const ele of msg.stamp_sents) {
    n++;
    out.push(`${n}`);
    // 对于看到的字幕来说，有一定体感上的延时
    out.push(`${msToSrtTime(ele.start)} --> ${msToSrtTime(ele.end)}`);
    let txt = ele.text_seg.replace(/\s+/g, '');
    switch (ele.punc) {
      case ',':
      case '.':
      case '，':
      case '。':
        break;
      default:
        txt += ele.punc;
    }
    out.push(txt);
    out.push('');
  }

  return out.join('\n');
}

function msToSrtTime(ms: number) {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;

  const formatNumber = (num: number, digits: number) => String(num).padStart(digits, '0');

  return `${formatNumber(hours, 2)}:${formatNumber(minutes, 2)}:${formatNumber(seconds, 2)},${formatNumber(milliseconds, 3)}`;
}

export async function requestOffline({
  ws,
  data,
  hotwords,
  itn,
  timeout: timeoutMs,
}: {
  ws: WebSocket;
  data: Buffer;
  hotwords?: Record<string, number>;
  itn?: boolean;
  timeout?: number;
}) {
  const ac = new AbortController();
  const uid = `${randomUUID()}.amr`;
  const future = createLazyPromise();
  const handleMessage = (buf: Buffer) => {
    const res = JSON.parse(buf.toString()) as OfflineResponseMessage;
    if (res.wav_name !== uid) {
      return;
    }
    // is_final is not works for offline
    future.resolve(res);
  };
  const signal = ac.signal;

  try {
    ws.once('close', ac.abort);
    ws.once('error', ac.abort);

    ws.on('message', handleMessage);

    ws.send(
      JSON.stringify({
        mode: 'offline',
        wav_name: uid,
        wav_format: 'amr',
        is_speaking: true,
        hotwords: hotwords ? JSON.stringify(hotwords) : undefined,
        itn,
      } as OfflineRequestMessage),
    );

    ws.send(data);
    ws.send(
      JSON.stringify({
        mode: 'offline',
        wav_name: uid,
        is_speaking: false,
      } as Partial<OfflineRequestMessage>),
    );
    // 长语音可能需要等待很久
    const out = (await Promise.race(
      [
        future,
        new Promise((_, reject) => {
          signal.addEventListener('abort', reject);
        }),
        timeoutMs && timeout(future, timeoutMs),
      ].filter(Boolean),
    )) as OfflineResponseMessage;

    return {
      result: out,
      get srt() {
        return toSrt(out);
      },
    };
  } finally {
    ac.abort();
    ws.off('message', handleMessage);
    ws.off('close', ac.abort);
    ws.off('error', ac.abort);
  }
}
