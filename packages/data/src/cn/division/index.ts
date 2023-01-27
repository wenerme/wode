export { randomDivisionCode } from './parseDivisionCode';

//@ts-ignore
declare module '@wener/data/cn/division/divisions.json' {
  const Divisions: Record<string, string>;
  export default Divisions;
}
