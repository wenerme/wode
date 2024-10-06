export interface OfflineRequestMessage {
  mode: 'offline';
  wav_name: string;
  wav_format: string | 'pcm' | 'mp3' | 'mp4';
  is_speaking: boolean; // false -> 断句尾点，例如，vad切割点，或者一条wav结束
  audio_fs?: number; // pcm 采样率
  hotwords?: string; // 热词
  itn?: boolean; // 默认 true
}

export interface OfflineResponseMessage {
  mode: 'offline';
  wav_name: string;
  text: string;
  is_final: boolean;
  timestamp?: number[][]; // 时间戳 "[[100,200], [200,500]]"(ms)
  stamp_sents?: {
    text_seg: string; // 正 是 因 为
    punc: string; // ,
    start: number;
    end: number;
    ts_list: number[][]; // [[430,670],[670,810],[810,1030],[1030,1130]]
  }[];
}
