export interface StringFormat<GenerateOptions, ParsedObject> {
  regex?: RegExp;
  validate: (s: string) => boolean;
  generate: (opts?: GenerateOptions) => ParsedObject;
  parse: (s: string) => ParsedObject | undefined;
}

export interface StringChecksum {
  validate: (s: string) => boolean;
  generate: (s: string) => string;
}
