import fs from 'node:fs/promises';

export async function copy({ dest, content }: { dest: string; content: string }) {
  try {
    const crypto = await import('node:crypto');
    const stat = await fs.stat(dest);
    if (stat.isFile()) {
      const hash = crypto.createHash('md5');
      hash.update(await fs.readFile(dest));
      if (hash.digest().equals(crypto.createHash('md5').update(content).digest())) {
        return {
          changed: false,
        };
      }
    }
  } catch (e) {}
  await fs.writeFile(dest, content, {});
  return {
    changed: true,
  };
}
