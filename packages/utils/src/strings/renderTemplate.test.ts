/* eslint no-template-curly-in-string:0 */
import { expect, test } from 'vitest';
import { renderTemplate } from './renderTemplate';

test('renderTemplate', () => {
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
    expect(renderTemplate(k, obj)).toBe(v);
  }
  expect(renderTemplate('My name is ${name}', (v) => v)).toBe('My name is name');
  expect(renderTemplate('My name is ${name}', obj, 'common')).toBe('My name is ${name}');
  expect(renderTemplate('My name is {{name}}', obj, 'common')).toBe('My name is wener');
});
