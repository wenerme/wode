import { test } from 'vitest';
import { z } from 'zod';
import { Method } from './Method';
import { Service } from './Service';
import type { ServiceSchema } from './getServiceSchema';
import { getServiceSchema } from './getServiceSchema';

test('gen php', () => {
  const schema = getServiceSchema(HelloService);
  if (!schema) {
    throw new Error('schema not found');
  }
  console.log(genPHPService(schema));
});

function genPHPService(schema: ServiceSchema) {
  const sb = [];
  sb.push(`
#[Service([
  'name' => '${schema.name}',
])]
interface ${schema.name.split('.').at(-1)} {
${schema.methods
  .map((v) => {
    return `
#[Method()]
function ${v.name}($req, $meta = null);
`.trim();
  })
  .join('\n')
  .replaceAll(/^/gm, '  ')}
}
  `);
  return sb.join('\n');
}

const HelloRequestSchema = z.object({
  name: z.string(),
});
type HelloRequest = z.infer<typeof HelloRequestSchema>;

@Service({
  name: 'hello.HelloService',
})
class HelloService {
  @Method({
    input: HelloRequestSchema,
  })
  hello(req: HelloRequest) {}

  @Method({
    input: HelloRequestSchema,
  })
  hi(req: HelloRequest) {}
}
