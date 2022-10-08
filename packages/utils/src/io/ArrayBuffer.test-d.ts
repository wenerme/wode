import { expectType } from 'tsd';
import { ArrayBuffers } from './ArrayBuffers';

expectType<Buffer>(ArrayBuffers.asView(Buffer, new Uint8Array()));
