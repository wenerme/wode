/**
 * @see https://github.com/os-js/osjs-webdav-adapter/blob/master/index.js
 */
export interface FS {
  mkdir(dir: string, opts?: { recursive?: boolean; mode?: Mode }): Promise<void>;

  lock(path: string): Promise<string>;

  unlock(path: string, token: string): Promise<void>;

  readFile(file: string, opts?: { encoding?: string }): Promise<string>;

  writeFile(file: string, content: string, opts?: { mode?: Mode; append?: boolean }): Promise<void>;

  copyFile(src: string, dst: string): Promise<void>;

  cp(
    src: string,
    dst: string,
    opts?: {
      force?: boolean;
      dereference?: boolean;
      recursive?: boolean;
    },
  ): Promise<void>;

  exists(path: string): Promise<boolean>;

  access(path: string, mode: number): Promise<void>;

  stat(path: string): Promise<Stats>;

  readdir(path: string): Promise<Dirent[]>;

  unlink(path: string): Promise<void>;

  rename(old: string, neo: string): Promise<void>;

  truncate(path: string, opts: { size?: number }): Promise<void>;

  chown(path: string, opts: { uid?: number; gid?: number }): Promise<void>;

  chmod(path: string, opts: { mode?: Mode }): Promise<void>;

  link(existing: string, neo: string): Promise<void>;

  symlink(target: string, path: string): Promise<void>;

  readlink(path: string): Promise<string>;

  realpath(path: string): Promise<string>;

  rmdir(path: string, opts?: { recursive?: boolean; force?: boolean }): Promise<void>;

  rm(path: string, opts?: { recursive?: boolean; force?: boolean }): Promise<void>;

  mkdtemp(prefix: string): Promise<string>;

  utimes(path: string, opts: { atime?: Date; mtime?: Date }): Promise<void>;
}

export interface Dirent {
  type: FileType;
  name: string;
}

export type Mode = number | string;

export type FileType = 'file' | 'directory' | 'block-device' | 'character-device' | 'symlink' | 'fifo' | 'socket';

export interface Stats {
  type: FileType;
  atime: Date;
  mtime: Date;
  ctime: Date;
  btime: Date;
  size: number;
  mode: number;
}
