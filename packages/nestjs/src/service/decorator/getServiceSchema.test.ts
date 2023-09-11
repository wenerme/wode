import { expect, test } from 'vitest';
import { Method } from './Method';
import { Service } from './Service';
import { getServiceSchema } from './getServiceSchema';

test('base service schema', () => {
  function check(cls: any) {
    const schema = getServiceSchema(cls);
    expect(schema).toBeTruthy();
    expect(schema?.name).toBe('test.TestService');
    expect(schema?.options).toEqual({ name: 'test.TestService' });

    expect(schema?.methods).toHaveLength(1);
    expect(schema?.methods[0].name).toBe('hello');
    expect(schema?.methods[0].options.name).toBe('HELLO');
  }

  check(TestService);
  // missing @Service still works ?
  check(Test2);

  {
    const schema = getServiceSchema(Test3);
    expect(schema).toBeTruthy();
    expect(schema?.name).toBe('test.Test3');
    expect(schema?.methods).toHaveLength(2);
    // override
    expect(schema?.methods[0].name).toBe('hello');
    expect(schema?.methods[0].options.name).toBe('HE');
    expect(schema?.methods[0].options.timeout).toBe(2);
    expect(schema?.methods[1].options.name).toBe('SK');
  }
});

@Service({
  name: 'test.TestService',
})
abstract class TestService {
  @Method({
    name: 'HELLO',
    timeout: 1,
  })
  hello() {}

  skip() {}
}

class Test2 extends TestService {}

@Service({
  name: 'test.Test3',
})
class Test3 extends TestService {
  @Method({
    name: 'HE',
    timeout: 2,
  })
  hello() {}

  @Method({
    name: 'SK',
  })
  skip() {}
}
