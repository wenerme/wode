import { getGlobalThis } from '../isomorphics/getGlobalThis';

const globalThis = getGlobalThis();

/**
 * transferable object pass between workers, can work with structuredClone
 *
 * - Chrome 87, FF 103, Safari X, NodeJS X
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Glossary/Transferable_objects | Transferable objects}
 */
export function isTransferable(v: any): v is TransferableObject {
  _ctors ||= ctors();
  return _ctors.some((ctor) => v instanceof ctor);
}

let _ctors: any[];

function ctors() {
  const o: any = globalThis.window || globalThis || global;
  return [
    o.ArrayBuffer,
    o.MessagePort,
    o.ReadableStream,
    o.WritableStream,
    o.TransformStream,
    o.AudioData,
    o.ImageBitmap,
    o.VideoFrame,
    o.OffscreenCanvas,
    o.RTCDataChannel,
  ].filter(Boolean);
}

export type TransferableObject =
  | Transferable
  | ArrayBuffer
  | MessagePort
  | ReadableStream
  | WritableStream
  | TransformStream
  | AudioData
  | ImageBitmap
  | VideoFrame
  | OffscreenCanvas
  | RTCDataChannel;

declare global {
  interface OffscreenCanvas {}

  interface VideoFrame {}

  interface AudioData {}
}
