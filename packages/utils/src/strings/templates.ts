/**
 * 替换类似于 JS 的模板字符串
 *
 * @example
 * templateString('My name is ${name}',{name:'wener'})
 */
export function templateString(template: string, getter: (v: string) => any) {
  return template.replace(/\${(.*?)}/g, (_, g) => {
    // variables[g.trim()]
    // 支持路径 - 例如 a.b[0]
    return getter(g.trim());
  });
}
