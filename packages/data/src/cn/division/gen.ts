/* eslint-disable @typescript-eslint/naming-convention */
import fs from 'fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const provinces: Entry[] = await fetch(
  'https://ghproxy.com/https://raw.githubusercontent.com/modood/Administrative-divisions-of-China/master/dist/provinces.json',
).then((v) => v.json());
const cities: Entry[] = await fetch(
  'https://ghproxy.com/https://raw.githubusercontent.com/modood/Administrative-divisions-of-China/master/dist/cities.json',
).then((v) => v.json());
const areas: Entry[] = await fetch(
  'https://ghproxy.com/https://raw.githubusercontent.com/modood/Administrative-divisions-of-China/master/dist/areas.json',
).then((v) => v.json());

interface Entry {
  code: string;
  name: string;
  cityCode: string;
  provinceCode: string;
}

const codes = Object.fromEntries(
  [
    areas.map((v) => [v.code, v.name]),
    cities.map((v) => [v.code.padEnd(6, '0'), v.name]),
    provinces.map((v) => [v.code.padEnd(6, '0'), v.name]),
  ]
    .flat()
    .sort((a, b) => a[0].localeCompare(b[0])),
);

await fs.writeFile(`${__dirname}/divisions.json`, JSON.stringify(codes, null, 2));
