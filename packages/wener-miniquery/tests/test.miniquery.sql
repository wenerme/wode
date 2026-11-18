-- MiniQuery is an expression language, not native MySQL.
-- Each case contains one expression; semicolons are not statement delimiters here.

-- @case literal-number
-- @expect {"type":"literal","value":42}
42

-- @case literal-string
-- @expect {"type":"literal","value":"semi;colon"}
'semi;colon'

-- @case literal-null
-- @expect {"type":"literal","value":null}
null

-- @case boolean
-- @expect {"type":"literal","value":false}
false

-- @case reference-starting-like-literal
-- @expect {"type":"logic","context":{"trueValue":1,"nullish":null},"value":true}
trueValue = 1 AND nullish IS NULL

-- @case nested-reference
-- @expect {"type":"ref","context":{"profile":{"age":21}},"value":21}
profile.age

-- @case arithmetic-precedence
-- @expect {"type":"binary","value":7}
1 + 2 * 3

-- @case grouped-arithmetic
-- @expect {"type":"binary","value":9}
(1 + 2) * 3

-- @case unary-negation
-- @expect {"type":"unary","value":false}
NOT true

-- @case logical-precedence
-- @expect {"type":"logic","value":true}
1 = 1 AND (2 > 3 OR 4 <= 4)

-- @case miniquery-operator-aliases
-- @expect {"type":"logic","value":true}
1 == 1 && !false || false

-- @case not-equal
-- @expect {"type":"compare","value":true}
1 <> 2

-- @case mixed-list
-- @expect {"type":"list","value":[1,"two",true,null]}
[1, 'two', true, null,]

-- @case empty-list
-- @expect {"type":"list","value":[]}
[]

-- @case list-membership
-- @expect {"type":"compare","value":true}
2 IN [1, 2, 3,]

-- @case list-exclusion
-- @expect {"type":"compare","value":true}
4 NOT IN (1, 2, 3)

-- @case inclusive-range
-- @expect {"type":"compare","value":true}
21 BETWEEN 18 AND 30

-- @case exclusive-range
-- @expect {"type":"compare","value":true}
35 NOT BETWEEN 18 AND 30

-- @case null-comparison
-- @expect {"type":"compare","value":true}
null IS NULL

-- @case not-null-comparison
-- @expect {"type":"compare","value":true}
1 IS NOT NULL

-- @case like-pattern
-- @expect {"type":"compare","evaluationError":"Unsupported compare op: LIKE"}
'Alice' LIKE 'Al%'

-- @case contains-expression
-- @expect {"type":"compare","evaluationError":"Unsupported compare op: @>"}
tags @> ['admin', 'user']

-- @case function-call
-- @expect {"type":"func"}
coalesce(null, 1, 2)

-- @case searched-case
-- @expect {"type":"case","value":"adult"}
CASE WHEN 21 >= 18 THEN 'adult' ELSE 'minor' END

-- @case simple-case
-- @expect {"type":"case","value":"active"}
CASE 1 WHEN 1 THEN 'active' WHEN 2 THEN 'paused' ELSE 'unknown' END

-- @case comments-between-tokens
-- @expect {"type":"logic","value":true}
1 = 1 /* filter */ AND
-- a line comment
2 > 1

-- @case invalid-trailing-token
-- @error
1 = 1 garbage

-- @case invalid-missing-operand
-- @error
a >

-- @case invalid-unclosed-list
-- @error
a IN [1, 2

-- @case invalid-sql-statement
-- @error
SELECT * FROM users
