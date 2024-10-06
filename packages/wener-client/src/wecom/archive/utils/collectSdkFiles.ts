import { match } from 'ts-pattern';
import type { MessageTypeContent } from '../types';
import { parseChatRecordMessageItem } from './parseChatRecordMessageItem';
import { parseMixedMessageItem } from './parseMixedMessageItem';

export type CollectSdkFileItem = {
  filename?: string;
  md5?: string;
  sdkFileId: string;
  size?: number;
  width?: number;
  height?: number;
  duration?: number;
  ext?: string;
  index: number;
};

export function collectSdkFiles(msg: MessageTypeContent) {
  const files: CollectSdkFileItem[] = [];
  let index = 0;
  const addFile = (file: Omit<CollectSdkFileItem, 'index'>) => {
    let v: CollectSdkFileItem = file as CollectSdkFileItem;
    v.index = index++;
    files.push(v);
  };

  // file like: 'emotion', 'file', 'image', 'voice', 'video', voip_doc_share
  // complex: mixed, chatrecord, voip_doc_share, meeting_voice_call
  match(msg)
    .with(
      { type: 'file' },
      ({ content: { md5sum: md5, filename, fileext: ext, filesize: size, sdkfileid: sdkFileId } }) => {
        addFile({
          filename,
          md5,
          sdkFileId,
          size,
          ext,
        });
      },
    )
    .with({ type: 'image' }, ({ content: { md5sum: md5, sdkfileid: sdkFileId, filesize: size } }) => {
      addFile({
        md5,
        sdkFileId,
        size,
        ext: 'jpg',
      });
    })
    .with(
      { type: 'voice' },
      ({ content: { md5sum: md5, sdkfileid: sdkFileId, voice_size: size, play_length: duration } }) => {
        addFile({
          md5,
          sdkFileId,
          size,
          duration,
          ext: 'amr',
        });
      },
    )
    .with(
      { type: 'video' },
      ({ content: { md5sum: md5, sdkfileid: sdkFileId, filesize: size, play_length: duration } }) => {
        addFile({
          md5,
          sdkFileId,
          size,
          duration,
          ext: 'mp4',
        });
      },
    )
    .with(
      { type: 'emotion' },
      ({ content: { md5sum: md5, sdkfileid: sdkFileId, imagesize: size, width, height, type } }) => {
        addFile({
          md5,
          sdkFileId,
          size,
          width,
          height,
          ext: ['png', 'gif'][type],
        });
      },
    )
    .with(
      { type: 'voip_doc_share' },
      ({ content: { md5sum: md5, sdkfileid: sdkFileId, filesize: size, filename } }) => {
        addFile({
          md5,
          sdkFileId,
          size,
          filename,
        });
      },
    )
    .with({ type: 'meeting_voice_call' }, ({ content: { sdkfileid: sdkFileId } }) => {
      addFile({
        sdkFileId,
        ext: 'arm',
      });
    })
    .with({ type: 'mixed' }, ({ content: { item } }) => {
      item.forEach((v) => {
        collectSdkFiles(parseMixedMessageItem(v)).forEach(addFile);
      });
    })
    .with({ type: 'chatrecord' }, ({ content: { item } }) => {
      item.forEach((v) => {
        collectSdkFiles(parseChatRecordMessageItem(v)).forEach(addFile);
      });
    });
  return files;
}
