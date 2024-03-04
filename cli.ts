import fs from 'node:fs/promises';

await runNormalizePackageJson();

async function runBuildLib() {
  //
}

async function runNormalizePackageJson() {
  const pkg = JSON.parse(await fs.readFile('package.json', 'utf8'));
  normalizePackageJson(pkg);
  await fs.writeFile('package.json', JSON.stringify(pkg, null, 2));
}

function normalizePackageJson(pkg: any) {
  pkg.publishConfig ||= {};

  pkg.exports = map(pkg.exports, (v) => {
    if (typeof v === 'object' && v && Object.keys(v).length === 1 && 'default' in v) {
      return v.default;
    }
    return v;
  });

  // ./src/index.ts -> ./lib/index.js
  pkg.publishConfig.exports = map(pkg.exports, (v: any) => {
    let def = v.default || v;
    if (typeof def !== 'string') {
      return v;
    }
    if (!/(?![.]d)[.]m?tsx?$/.test(def)) {
      return v;
    }
    const vv = {
      types: def,
      default: def.replace(/^[.]\/src\//, './lib/').replace(/\.tsx?$/, '.js'),
    };
    return vv;
  });
}

function map(obj: any, fn: (v: any, k: string) => any) {
  const all = Object.entries(obj).map(([k, v]) => [k, fn(v, k)] as [string, any]);
  all.sort(([a], [b]) => {
    if (a === 'package.json') {
      return -1;
    }
    if (b === 'package.json') {
      return 1;
    }
    return a.localeCompare(b);
  });
  return Object.fromEntries(all);
}
