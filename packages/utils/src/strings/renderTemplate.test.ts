import test from 'ava';
import { renderTemplate } from './renderTemplate';

test('renderTemplate', (t) => {
  const obj = {
    name: 'wener',
    authors: [
      {
        name: 'wener',
      },
    ],
  };
  for (const [k, v] of Object.entries({
    'My name is ${name}': 'My name is wener',
    'My name is ${  authors[0].name  }': 'My name is wener',
  })) {
    t.is(renderTemplate(k, obj), v);
  }
  t.is(
    renderTemplate('My name is ${name}', (v) => v),
    'My name is name',
  );
  t.is(renderTemplate('My name is ${name}', obj, 'common'), 'My name is ${name}');
  t.is(renderTemplate('My name is {{name}}', obj, 'common'), 'My name is wener');
});
