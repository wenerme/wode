import fs from 'node:fs/promises';
import { getBuildInfo } from '@wener/console/buildinfo';

const info = getBuildInfo();
console.log(info);
await fs.writeFile('public/version.json', JSON.stringify(info, null, 2));
