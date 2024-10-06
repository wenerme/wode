export function parse(input: string, options?: ParseOptions);

export interface ParseOptions {
  grammarSource?: string;
  startRule?: string;

  [k: string]: any;
}

export class SyntaxError extends Error {
  expected: string[];
  found: string | null;
  location: Location;
}

interface Location {
  source: string | undefined;
  start: { offset: number; line: number; column: number };
  end: { offset: number; line: number; column: number };
}

export const StartRules: string[];
