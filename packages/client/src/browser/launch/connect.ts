import fs from 'node:fs/promises';
import path from 'node:path';
import { createChildLogger, createLogger, type Logger } from '@wener/utils';

export async function connect({
  name: uid = 'default',
  dataDir = process.env.BROWSER_DATA_DIR || 'data/browsers',
  cacheDir = path.join(dataDir, 'cache'),
  ...options
}: {
  name?: string;
  dataDir?: string;
  cacheDir?: string;
  logger?: Logger;
}) {
  const logger = createChildLogger(options.logger ?? createLogger(), { uid });
  const userDataDir = path.join(dataDir, uid);

  // try reconnect
  {
    const devPortFile = path.join(userDataDir, 'DevToolsActivePort');

    let found = false;
    try {
      found = (await fs.stat(devPortFile)).isFile();
    } catch {}

    if (found) {
      const [port] = (await fs.readFile(devPortFile, 'utf8')).split('\n');
      logger.info(`DevToolsActivePort: ${port}`);
      const ac = new AbortController();
      setTimeout(() => {
        ac.abort();
      }, 3000);
      const res = await fetch(`http://127.0.0.1:${port.trim()}/json/version`, {
        signal: ac.signal,
      }).catch(() => undefined);
      if (!res || !res.ok) {
        return;
      }

      const { webSocketDebuggerUrl } = await res.json();
      logger.info(`Reusing browser ${uid} at ${webSocketDebuggerUrl}`);
      const { default: puppeteer } = await import('puppeteer-core');
      const browser = await puppeteer.connect({ browserWSEndpoint: webSocketDebuggerUrl });
      return browser;
    }
  }
}
