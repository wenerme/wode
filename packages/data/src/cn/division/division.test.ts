import test from 'ava';
import { parseDivisionCode } from './parseDivisionCode';

test('division', async (t) => {
  const { default: divisions } = await import('../../../cn/division/divisions.json');
  t.deepEqual(parseDivisionCode(divisions, '441422'), {
    cityCode: '4414',
    cityName: '梅州市',
    code: '441422',
    name: '大埔县',
    provinceCode: '44',
    provinceName: '广东省',
  });
});
