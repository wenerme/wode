import test from 'ava';
import { loadCounty } from './loaders';
import { parseDivisionCode, split } from './parseDivisionCode';
import { getDivisionTable } from './table';

test.before(async () => {
  await loadCounty();
});

test('division', async (t) => {
  t.deepEqual(parseDivisionCode('441422'), {
    level: 'county',
    code: '441422',
    names: ['广东省', '梅州市', '大埔县'],
    province: {
      code: '44',
      name: '广东省',
    },
    city: {
      code: '4414',
      name: '梅州市',
    },
    county: {
      code: '441422',
      name: '大埔县',
    },
  });

  const table = getDivisionTable();
  t.deepEqual(table.get(3101), {
    name: '市辖区',
    children: [
      310101, 310104, 310105, 310106, 310107, 310109, 310110, 310112, 310113, 310114, 310115, 310116, 310117, 310118,
      310120, 310151,
    ],
  });
});

test('parse', (t) => {
  t.deepEqual(split('659010000000'), ['65', '90', '10']);
});
