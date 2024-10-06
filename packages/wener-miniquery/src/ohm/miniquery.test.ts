import { assert, test } from 'vitest';
import { MiniQueryGrammar, toMiniQueryAST } from './';

test('miniquery syntax', () => {
  for (const v of [
    // base
    '- 1.1',
    '+ 1.1',
    `-a > -1 and +b < +2`,
    `now()`,
    // logic
    `a IS NOT TRUE and b is NOT false`,
    `(1=1) or( 1=2 )or( 1=3)or(1=3 ) `,
    `not true`,
    `not true or not 1 > 2`,
    // relational
    '1=1 and a >= 1',
    '1=1 AND a >= 1',
    `1=1 or 1=2 or 1=3 `,
    `a=b or a=0`,
    `a is  not    null`,
    `a is      null and a = true`,
    `1 in [0,1,2,3,4] and b >= 2 or c not in [] and d in ()`,
    `1 in [ 0 , 1 , 2 , 3 , 4 ]`,
    `a in ("a", "b"  ,"c")`,
    `a in (1)`,
    `a between 12 and 15 or b not between 67 and 78`,
    `a is  true and b is  not false and c is not null and d is null`,
    `owned = true`,
    `a between 1 and 2`,
    // string
    ` ( a like '%hello%' ) and b not ILIKE '%world%'`,
    // `a between [1,2]`, // 特殊的 between 语法，方便构造语法
    // function
    `a()`,
    `func(123)`,
    `func(1,2,3,4,5,)`,
    `func(0,true,false,null,'a',"bc")`,
    `func(['a',1,3])`,
    `date(a) = func(123)`,
    `func(a)`,
    `func(a,b)`,
    `func( a , b )`,
    `func(a ,name==1 )`,
    `func( a, name == 1 )`,
    `func( a, name in (1,2,3) )`,
    `func( a, name in ('a','b') )`,
    `date('2021-05-12T00:00:00+08:00')`,
    `profile.age > 10`,
    // rare cases
    `null == NULL`,
    `date(created_at) between date('2021-05-12T00:00:00+08:00') and date('2021-05-14T00:00:00+08:00')`,
    `a.b: 10`,
  ]) {
    const result = MiniQueryGrammar.match(v);
    assert.isTrue(result.succeeded());
    assert.doesNotThrow(() => toMiniQueryAST(result));
  }
});

test('miniquery incorrect syntax', () => {
  for (const v of [`a notlike '%hello%'`, `a notbetween a and b`]) {
    assert.isNotTrue(MiniQueryGrammar.match(v).succeeded());
  }
});
