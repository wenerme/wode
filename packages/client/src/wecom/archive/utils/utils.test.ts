import { describe, expect, test } from 'vitest';
import { collectSdkFiles } from './collectSdkFiles';
import { normalizeMessageTypeContent } from './normalizeMessageTypeContent';

describe('collectSdkFiles', () => {
  const VoiceAudioMessages = [
    {
      msgid: '10958372969718811103_1603875609',
      action: 'send',
      from: 'wmGAgeDQAAdBjb8CK4ieMPRm7Cqm-9VA',
      tolist: ['kenshin'],
      roomid: '',
      msgtime: 1603875609704,
      msgtype: 'voice',
      voice: {
        md5sum: '9db09c7fa627c9e53f17736c786a74d5',
        voice_size: 6810,
        play_length: 10,
        sdkfileid:
          'kcyZjZqOXhETGYxajB2Zkp5Rk8zYzh4RVF3ZzZGdXlXNWRjMUoxVGZxbzFTTDJnQ2YxL0NraVcxUUJNK3VUamhEVGxtNklCbjZmMEEwSGRwN0h2cU1GQTU1MDRSMWdTSmN3b25ZMkFOeG5hMS90Y3hTQ0VXRlVxYkR0Ymt5c3JmV2VVcGt6UlNXR1ZuTFRWVGtudXVldDRjQ3hscDBrMmNhMFFXVnAwT3Y5NGVqVGpOcWNQV2wrbUJwV01TRm9xWmNDRVVrcFY5Nk9OUS9GbXIvSmZvOVVZZjYxUXBkWnMvUENkVFQxTHc2N0drb2pJT0FLZnhVekRKZ1FSNDU3ZnZtdmYvTzZDOG9DRXl2SUNIOHc9PRI0TkRkZk56ZzRNVE13TVRjMk5qQTRNak0yTmw4ek5qRTVOalExTjE4eE5qQXpPRGMxTmpBNRogNzM3MDY2NmM2YTc5Njg3NDdhNzU3NDY0NzY3NTY4NjY=',
      },
    },
    {
      msgid: '17955920891003447432_1603875627',
      action: 'send',
      from: 'kenshin',
      tolist: ['wmGAgeDQAAHuRJbt4ZQI_1cqoQcf41WQ'],
      roomid: '',
      msgtime: 1603875626823,
      msgtype: 'video',
      video: {
        md5sum: 'd06fc80c01d6fbffcca3b229ba41eac6',
        filesize: 15169724,
        play_length: 108,
        sdkfileid:
          'MzAzMjYxMzAzNTYzMzgzMjMyMzQwMjAxMDAwMjA0MDBlNzc4YzAwNDEwZDA2ZmM4MGMwMWQ2ZmJmZmNjYTNiMjI5YmE0MWVhYzYwMjAxMDQwMjAxMDAwNDAwEjhORGRmTVRZNE9EZzFNREEyTlRjM056QXpORjgxTWpZeE9USTBOek5mTVRZd016ZzNOVFl5Tnc9PRogNTIzNGQ1NTQ5N2RhNDM1ZDhlZTU5ODk4NDQ4NzRhNDk=',
      },
    },
  ];

  test('video & voice', () => {
    const files = VoiceAudioMessages.map(normalizeMessageTypeContent).flatMap(collectSdkFiles);
    expect(files).toMatchObject([
      {
        md5: '9db09c7fa627c9e53f17736c786a74d5',
        duration: 10,
        index: 0,
      },
      {
        md5: 'd06fc80c01d6fbffcca3b229ba41eac6',
        size: 15169724,
        duration: 108,
      },
    ]);
  });

  const MixedMessages = [
    {
      msgid: 'DAQQluDa4QUY0On4kYSABAMgzPrShAE=',
      action: 'send',
      from: 'HeMiao',
      tolist: ['HeChangTian', 'LiuZeYu'],
      roomid: 'wr_tZ2BwAAUwHpYMwy9cIWqnlU3Hzqfg',
      msgtime: 1577414359072,
      msgtype: 'mixed',
      mixed: {
        item: [
          { type: 'text', content: '{"content":"你好[微笑]\\n"}' },
          {
            type: 'image',
            content:
              '{"md5sum":"368b6c18c82e6441bfd89b343e9d2429","filesize":13177,"sdkfileid":"CtYBMzA2OTAyMDEwMjA0NjIzMDYwMDIwMTAwMDWwNDVmYWY4Y2Q3MDIwMzBmNTliMTAyMDQwYzljNTQ3NzAyMDQ1ZTA1NmFlMjA0MjQ2NjM0NjIzNjY2MzYzNTMyMmQzNzYxMzQ2NDJkMzQ2MjYxNjQyZDM4MzMzMzM4MmQ3MTYyMzczMTM4NjM2NDYxMzczMjY2MzkwMjAxMDAwMjAzMDIwMDEwMDQxMDM2OGI2YzE4YzgyZTY0NDFiZmQ4OWIyNDNlOWQyNDI4MDIwMTAyMDIwMTAwMDQwMBI4TkRkZk2UWTRPRGcxTVRneE5URTFNRGc1TVY4eE1UTTFOak0yTURVeFh6RTFOemMwTVRNek5EYz0aIDQzMTY5NDFlM2MxZDRmZjhhMjEwY2M0NDQzZGUXOTEy"}',
          },
        ],
      },
    },
  ];

  test('mixed', () => {
    const files = MixedMessages.map(normalizeMessageTypeContent).flatMap(collectSdkFiles);
    expect(files).toMatchObject([
      {
        md5: '368b6c18c82e6441bfd89b343e9d2429',
        size: 13177,
        index: 0,
      },
    ]);
  });
});
