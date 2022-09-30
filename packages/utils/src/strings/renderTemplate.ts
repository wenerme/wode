import { get } from '../objects/get';

/**
 * 替换类似于 JS 的模板字符串
 *
 *   templateString('My name is ${name}',{name:'wener'}) // => 'My name is wener'
 *
 */
export function renderTemplate(
  template: string,
  data: ((v: string) => any) | object,
  match: 'js' | 'common' | RegExp = 'js',
) {
  let getter: Function;
  if (!data) {
    // todo warning in dev
    getter = () => '';
  } else if (typeof data === 'function') {
    getter = data;
  } else {
    getter = (v: string) => get(data, v);
  }
  if (typeof match === 'string') {
    match = Matches[match] || Matches['js'];
  }
  return template.replace(match, (_, g) => {
    return getter(g.trim());
  });
}

const Matches = {
  js: /\${(.*?)}/g,
  common: /{{(.*?)}}/g,
};
