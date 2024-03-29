import fs from 'node:fs/promises';
import path from 'node:path';
import { formatBytes } from '@wener/utils';

export async function cache(dir: string, url: string): Promise<string> {
  const key = path.basename(url);
  await fs.mkdir(path.join(dir), { recursive: true });
  const file = path.join(dir, key);
  try {
    await fs.stat(file);
    console.info('[cache] hit', url);
    return await fs.readFile(file, 'utf-8');
  } catch (e) {}
  console.info('[cache] miss', url);
  const text = await fetch(url).then((v) => {
    if (v.status >= 300) {
      throw new Error(`[cache] fetch ${url} ${v.status} ${v.statusText}`);
    }
    return v.text();
  });
  const size = new Blob([text]).size;
  console.info(`[cache] write ${file} ${formatBytes(size)} (${size})`);
  await fs.writeFile(file, text);
  return text;
}
