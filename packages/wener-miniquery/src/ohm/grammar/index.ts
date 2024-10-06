import grammar from './miniquery.ohm-bundle';

export { default as MiniQueryGrammar } from './miniquery.ohm-bundle';
export default grammar;
export const semantics = grammar.createSemantics();
export const MiniQuerySemantics = semantics;
