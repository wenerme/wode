export function parse(input: string, options?: ParseOptions);

export interface ParseOptions {
  grammarSource?: string;
  startRule?: string;

  [k: string]: any;
}
