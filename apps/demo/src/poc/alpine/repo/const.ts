export const AlpineArchitectures = ['x86', 'x86_64', 'armv7', 'armhf', 'aarch64', 'ppc64le', 's390x'];
export const AlpineRepos = ['main', 'community'];
const EdgeBranches = {
  branches: ['edge'],
  architectures: [...AlpineArchitectures, 'riscv64'],
  repos: ['main', 'community', 'testing'],
};
export const AlpineBranches = [
  EdgeBranches,
  {
    // 4 active + 1
    branches: ['v3.19', 'v3.18', 'v3.17', 'v3.16', 'v3.15'],
    architectures: AlpineArchitectures,
    repos: ['main', 'community'],
  },
];

export function getLatestAlpineBranch() {
  return 'v3.19';
}
