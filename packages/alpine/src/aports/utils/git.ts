export async function readGitLastLog() {
  // https://gist.github.com/varemenos/e95c2e098e657c7688fd
  return JSON.parse(
    String(
      (
        await $`git log -1 --pretty=format:'{"commit": "%H","abbreviated_commit": "%h", "tree": "%T","abbreviated_tree": "%t","parent": "%P","abbreviated_parent": "%p","refs": "%D","encoding": "%e","subject": "%s","sanitized_subject_line": "%f","body": "%b","commit_notes": "%N","verification_flag": "%G?","signer": "%GS","signer_key": "%GK","author": {  "name": "%aN",  "email": "%aE",  "date": "%aD"},"commiter": {  "name": "%cN",  "email": "%cE",  "date": "%cD"}}'`
      ).stdout,
    ),
  );
}

export async function readGitContext() {
  return {
    branch: String(await $`git branch --show-current`).trim(),
    root: String(await $`git rev-parse --show-toplevel`).trim(),
  };
}

export interface GitLog {
  commit: string;
  abbreviated_commit: string;
  tree: string;
  abbreviated_tree: string;
  parent: string;
  abbreviated_parent: string;
  refs: string;
  encoding: string;
  subject: string;
  sanitized_subject_line: string;
  body: string;
  commit_notes: string;
  verification_flag: string;
  signer: string;
  signer_key: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  commiter: {
    name: string;
    email: string;
    date: string;
  };
}
