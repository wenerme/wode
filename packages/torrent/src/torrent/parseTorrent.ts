import { Bencode } from '../index';
import { arrayOfMaybeArray, hex, sha1 } from '@wener/utils';
import { Torrent, TorrentInfo, TorrentInfoFile } from './torrent';


interface ParsedTorrentFile {
  path: string;
  name: string;
  length: number;
  offset: number;
  pieceLength: number;
  piece0Hash: string;
  piece0Offset: number;
  piece1Hash?: string;
}

interface ParsedTorrent {
  torrent: Torrent;
  info: TorrentInfo;
  // infoBuffer: ArrayBuffer;
  infoHash: string;
  // infoHashBuffer?: Buffer;
  name: string;
  private: boolean;
  createdAt?: Date;
  createdBy?: string;
  announce: string[];
  urlList: string[];
  pieceLength: number;
  lastPieceLength: number;
  pieces: string[];
  length: number;
  files: ParsedTorrentFile[];
  comment?: string;
  extras: Record<string, any>;
}

export async function infoHash(s: BufferSource) {
  return hex(await sha1(s));
}

export async function parseTorrent(data: BufferSource): Promise<ParsedTorrent> {
  // https://github.com/webtorrent/parse-torrent

  let torrent = Bencode.createDecoder().addBufferPath('info.pieces').decode(data) as Torrent;

  // sanity check
  ensure(torrent.info, 'info');
  let name = torrent.info['name.utf-8'] || torrent.info.name;
  ensure(name, 'info.name');
  ensure(torrent.info['piece length'], 'info[\'piece length\']');
  ensure(torrent.info.pieces, 'info.pieces');

  if (torrent.info.files) {
    torrent.info.files.forEach((file, i) => {
      ensure(file, `info.files[${i}]`);
      ensure(typeof file.length === 'number', `info.files[${i}].length`);
      ensure(file['path.utf-8'] || file.path, `info.files[${i}].path`);
    });
  } else {
    ensure(typeof torrent.info.length === 'number', 'info.length');
  }

  let infoBuffer = Bencode.encode(torrent.info);

  const result: ParsedTorrent = {
    torrent: torrent,
    info: torrent.info,
    infoHash: await infoHash(infoBuffer),
    // infoBuffer: infoBuffer,
    name: name!,
    announce: uniq([arrayOfMaybeArray(torrent.announce), torrent['announce-list']].filter(Boolean).flat(2)) as string[],
    private: Boolean(torrent.info.private),
    // handle url-list (BEP19 / web seeding)
    urlList: uniq(arrayOfMaybeArray(torrent['url-list']).filter(Boolean)),
    pieceLength: 0,
    files: [],
    pieces: [],
    lastPieceLength: 0,
    length: 0,
    extras: omit(torrent, 'info', 'creation date', 'created by', 'announce', 'announce-list', 'url-list', 'comment'),
  };

  if (torrent.comment) result.comment = torrent.comment;
  {
    const val = torrent['creation date'] || torrent['save date'];
    if (val) result.createdAt = new Date(val * 1000);
  }
  {
    let val = torrent['created by'] || torrent['saved by'];
    if (val) result.createdBy = val;
  }


  const files = torrent.info.files || [torrent.info as TorrentInfoFile];

  result.pieceLength = torrent.info['piece length']!;
  result.pieces = splitPieces(torrent.info.pieces!);

  let offset = 0;
  result.files = files.map((file) => {
    const parts = [result.name, file['path.utf-8'] || file.path].filter(Boolean);
    let v: ParsedTorrentFile = {
      // path: path.join.apply(null, ['/'].concat(parts)).slice(1),
      path: parts.join('/'),
      name: parts[parts.length - 1],
      length: file.length,
      offset: offset,
      piece0Hash: result.pieces[Math.floor(offset / result.pieceLength)],
      piece0Offset: offset % result.pieceLength,

      // offset: files.slice(0, i).reduce((c, v) => c + v.length, 0),
      pieceLength: result.pieceLength,
    };
    if (v.length > v.pieceLength && v.piece0Offset) {
      v.piece1Hash = result.pieces[1 + Math.floor(offset / result.pieceLength)];
    }

    offset += file.length;
    return v;
  });
  result.length = result.files.reduce((c, v) => c + v.length, 0);
  const lastFile = result.files[result.files.length - 1];
  result.lastPieceLength = ((lastFile.offset + lastFile.length) % result.pieceLength) || result.pieceLength;

  return result;
}

function omit<T extends object, K extends keyof T>(obj: T, ...keys: K[]) {
  return Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k as any)));
}

function uniq<T>(v: Array<T>) {
  return Array.from(new Set(v));
}

function splitPieces(buf: Uint8Array) {
  const pieces = [];
  for (let i = 0; i < buf.length; i += 20) {
    pieces.push(hex(buf.subarray(i, i + 20)));
  }
  return pieces;
}

function ensure<T>(v: any, fieldName: string): asserts v is AssertTrue<T> {
  if (v === null || v === undefined || v === false) throw new Error(`Torrent is missing required field: ${fieldName}`);
}

type AssertTrue<T> = T extends null | undefined | false ? never : T;


