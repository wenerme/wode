export interface Torrent {
  info: TorrentInfo;
  // TorrentV2
  'piece layers'?: Record<string, any>;

  'creation date'?: number;
  'created by'?: string;
  comment?: string;
  'announce-list'?: string[][];
  announce?: string;
  'url-list'?: string | string[];

  [k: string]: any;
}

export interface TorrentInfo {
  'name.utf-8'?: string;
  name?: string;
  files?: TorrentInfoFile[];
  'piece length'?: number;
  pieces?: Uint8Array;
  private?: boolean;
  length?: number;

  // TorrentV2
  'meta version'?: 2;
  'file tree'?: Record<string, Record<string, { length: number; 'pieces root': string }>>;

  [k: string]: any;
}

export interface TorrentInfoFile {
  path: string;
  'path.utf-8'?: string;
  name: string;
  length: number;
  offset: number;

  [k: string]: any;
}
