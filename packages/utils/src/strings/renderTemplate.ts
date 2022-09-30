import { get } from '../objects/get';

/**
 * render template like js template string
 *
 * @example
 * renderTemplate('My name is ${name}',{name:'wener'})
 * // 'My name is wener'
 *
 * @param match `js` for `${name}`, common for `{{name}}`
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
