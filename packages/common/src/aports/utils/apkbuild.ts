import 'zx/globals';

export async function readApkBuild() {
  let info = await $`env -i bash -c '. APKBUILD; echo "$pkgname#$pkgver#$pkgrel#$source"'`;
  let [name, ver, rel, source] = String(info).split('#');
  let sources = source
    .split(/\s+/)
    // seaweedfs-3.41.tar.gz::https://github.com/chrislusf/seaweedfs/archive/3.41.tar.gz
    .flatMap((v) => v.split('::'))
    .map((v) => v.trim())
    .filter((v) => /^https?:/.test(v));
  return { name, ver, rel: parseInt(rel), sources };
}

export async function writeApkBuild({
  ver,
  rel,
  write = true,
}: { ver?: string; rel?: string | number; write?: boolean } = {}) {
  let apkbuild = await fs.readFile('APKBUILD', 'utf-8');

  if (ver) apkbuild = apkbuild.replace(/^pkgver=.*/m, `pkgver=${ver}`);
  if (rel === 0 || rel) apkbuild = apkbuild.replace(/^pkgrel=.*/m, `pkgrel=${rel}`);

  if (write) {
    await fs.writeFile('APKBUILD', apkbuild);
  }
  return apkbuild;
}
