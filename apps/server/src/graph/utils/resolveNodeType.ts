import { getEntityDef, parseEntityTypeId } from '@wener/nestjs/entity';

export function resolveNodeType(value: any) {
  if ('id' in value) {
    const [type] = parseEntityTypeId(value.id);
    if (!type) {
      throw new Error(`Invalid id ${value.id}`);
    }
    let def = getEntityDef(type);
    let name = def?.typeName;
    if (!name) {
      throw new Error(`Unknown type ${type} ${value.id}`);
    }
    return name;
  }
  console.error(`Unknown node type`, value);
  throw new Error(`Unknown node type ${value}`);
}
