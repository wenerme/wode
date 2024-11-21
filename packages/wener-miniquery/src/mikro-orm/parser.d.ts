export function parse(input: string, options?: ParseOptions): any;

export interface ParseOptions {
  grammarSource?: string;
  startRule?: string;

  [k: string]: any;
}
