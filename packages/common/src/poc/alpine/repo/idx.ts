export interface GitCommit {
  hash: string;
  message: string;
  treeHash: string;
  parentHashes: string[];

  author: GitCommitSignature;
  committer: GitCommitSignature;
}

export interface GitCommitSignature {
  name: string;
  email: string;
  date: Date;
}

/**
 * @see https://mirrors.alpinelinux.org/mirrors.json
 */
export interface MirrorEntry {
  name: string;
  location: string;
  bandwidth: string;
  host: string;
  urls: string[];
  lastUpdated: Date;
  lastError: string;
  lastRefreshDuration: number;
}
