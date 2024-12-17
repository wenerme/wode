type DefineFileTypeOptions = {
  name: string;
  title?: string;
  description?: string;
  type?: string;
  types?: string[];
  extension?: string;
  extensions?: string[];
  tags?: string[];
  metadata?: Record<string, any>;
};
export type FileTypeDef = {
  name: string;
  title: string;
  description?: string;
  type: string; // primary type
  extension: string; // primary extension
  types: string[];
  extensions: string[];
  tags: string[];
  metadata: Record<string, any>;
};

let _all: FileTypeDef[] = [];

export function defineFileType({
  type = '',
  types = [],
  extension = '',
  extensions = [],
  ...opts
}: DefineFileTypeOptions): FileTypeDef {
  if (!type) {
    type = types[0] || '';
  }
  if (!extension) {
    extension = extensions[0] || '';
  }
  if (!types.includes(type)) {
    types = [type, ...types];
  }
  if (!extensions.includes(extension)) {
    extensions = [extension, ...extensions];
  }

  const def: FileTypeDef = {
    title: opts.title || opts.name,
    type,
    extension,
    types,
    extensions,
    tags: [],
    metadata: {},
    ...opts,
  };
  let idx = _all.findIndex((v) => v.name === def.name);
  if (idx >= 0) {
    _all[idx] = def;
    console.warn(`File type ${def.name} is redefined`);
  } else {
    _all.push(def);
  }
  return def;
}

export function getFileType(): FileTypeDef[] {
  return _all;
}
