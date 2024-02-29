import { expect, test } from 'vitest';
import { Method } from './Method';
import { Service } from './Service';
import { getServiceSchema } from './getServiceSchema';

test('base service schema', () => {
  function checkTest1(cls: any) {
    const schema = getServiceSchema(cls);
    expect(schema).toBeTruthy();
    expect(schema?.name).toBe('test.TestService');
    expect(schema?.options).toEqual({ name: 'test.TestService' });

    expect(schema?.methods).toHaveLength(1);
    expect(schema?.methods[0].name).toBe('hello');
    expect(schema?.methods[0].options.name).toBe('HELLO');
  }

  checkTest1(TestService);
  // missing @Service still works ?
  checkTest1(Test2);

  function checkTest3(cls: any) {
    const schema = getServiceSchema(cls);
    expect(schema).toBeTruthy();
    expect(schema?.name).toBe('test.Test3');
    expect(schema?.methods).toHaveLength(2);
    // override
    expect(schema?.methods[0].name).toBe('hello');
    expect(schema?.methods[0].options.name).toBe('HE');
    expect(schema?.methods[0].options.timeout).toBe(2);
    expect(schema?.methods[1].options.name).toBe('SK');
  }

  checkTest3(Test3);
  // point to real service
  checkTest3(SomeMethod);
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

@Service({
  as: Test3,
})
class SomeMethod {
  skip() {}
}
