import { setCharToPinyinTable } from './toPinyinPure';
import { transformData } from './transform';

export function loadCharToPinyinTable(): Promise<Record<string, string[]>> {
  return import('./data.json' as unknown as string, { with: { type: 'json' } })
    .then((v) => v.default as Record<string, string[]>)
    .then((data) => {
      let out = transformData(data);
      setCharToPinyinTable(out);
      return out;
    });
}
