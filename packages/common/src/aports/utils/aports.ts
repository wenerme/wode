import path from 'node:path';
import fs from 'fs-extra';
import { readGitContext } from './git';

export function getAportsRepos(branch = 'edge') {
  if (branch !== 'edge') {
    return ['main', 'community'];
  }
  return ['main', 'community', 'testing'];
}

export async function readAportsContext() {
  let git = await readGitContext();
  if (!(await fs.exists(path.join(git.root, 'main')))) {
    throw new Error(`Please run this command in the root of the aports repository: ${git.root}`);
  }
  return {
    root: git.root,
    branch: git.branch === 'master' ? 'edge' : git.branch,
  };
}
