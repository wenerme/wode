export function getTypeCache() {
  return (_TypeBuildCache ||= new Map<any, any>());
}

let _TypeBuildCache: Map<string, any>;
