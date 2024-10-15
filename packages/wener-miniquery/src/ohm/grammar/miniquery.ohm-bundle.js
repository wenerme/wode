import { makeRecipe } from 'ohm-js';

const result = makeRecipe([
  'grammar',
  {
    source:
      'MiniQuery {\n  Main = Expr end\n  Expr = LogicExpr\n\n  LogicExpr\n    = LogicExpr logic RelExpr -- match\n    | RelExpr\n\n  RelExpr\n    = RelExpr (">=" | "<=" |  ">" | "<") InExpr -- match\n    | RelExpr ("==" | "!=" | "<>" | "=") InExpr -- match_eq\n    | RelExpr ":" literal -- has\n    | InExpr\n  InExpr\n    = InExpr in Array -- match\n    | PredicateExpr\n  PredicateExpr\n    = PredicateExpr is (null| bool) -- is\n    | PredicateExpr like string -- like\n    | BetweenExpr\n  BetweenExpr\n    = BetweenExpr between CallExpr "and" CallExpr -- match\n    | CallExpr\n  CallExpr\n    = ident "(" ListOf<Expr,","> ")" -- match\n    | PriExpr\n\n  PriExpr\n    = "(" Expr ")" -- paren\n    | caseInsensitive<"not"> Expr -- not\n    | Array\n    | Value\n    | "+" Expr -- pos\n    | "-" Expr -- neg\n\n\n  Array   = "(" ListOf<Expr,","> ")" | "[" ListOf<Expr,","> "]"\n  Value   = literal | ref | ident\n\n  ListOf<elem, sep>\n    := TrailNonEmptyListOf<elem, sep>\n    | EmptyListOf<elem, sep>\n\n  TrailNonEmptyListOf<elem, sep>\n    = elem (sep elem)* sep?\n\n  in = (caseInsensitive<"not"> space+)? caseInsensitive<"in">\n  is = caseInsensitive<"is"> (space+ caseInsensitive<"not">?)\n  logic = caseInsensitive<"and"> | caseInsensitive<"or"> | "&&" | "||"\n  like = (caseInsensitive<"not"> space+)? (caseInsensitive<"like"> | caseInsensitive<"ilike">)\n  between = (caseInsensitive<"not"> space+)? caseInsensitive<"between">\n\n  ref = ident ( "." (ident | string) )+\n  ident = letter (alnum | "_")*\n  literal = string | float | int | bool | null\n  null    = "null" | "NULL"\n  bool    = "true" | "false" | "TRUE" | "FALSE"\n  string\n    = "\'" (~"\'" any)* "\'"\n    | "\\"" (~"\\"" any)* "\\""\n  int = (("-"|"+") spaces)? uint\n  uint\n    = "0"\n    | int_non_zero\n  int_non_zero = "1".."9" digit*\n  float   = int? "." digit+\n}',
  },
  'MiniQuery',
  null,
  'Main',
  {
    Main: [
      'define',
      { sourceInterval: [14, 29] },
      null,
      [],
      [
        'seq',
        { sourceInterval: [21, 29] },
        ['app', { sourceInterval: [21, 25] }, 'Expr', []],
        ['app', { sourceInterval: [26, 29] }, 'end', []],
      ],
    ],
    Expr: ['define', { sourceInterval: [32, 48] }, null, [], ['app', { sourceInterval: [39, 48] }, 'LogicExpr', []]],
    LogicExpr_match: [
      'define',
      { sourceInterval: [68, 100] },
      null,
      [],
      [
        'seq',
        { sourceInterval: [68, 91] },
        ['app', { sourceInterval: [68, 77] }, 'LogicExpr', []],
        ['app', { sourceInterval: [78, 83] }, 'logic', []],
        ['app', { sourceInterval: [84, 91] }, 'RelExpr', []],
      ],
    ],
    LogicExpr: [
      'define',
      { sourceInterval: [52, 114] },
      null,
      [],
      [
        'alt',
        { sourceInterval: [68, 114] },
        ['app', { sourceInterval: [68, 91] }, 'LogicExpr_match', []],
        ['app', { sourceInterval: [107, 114] }, 'RelExpr', []],
      ],
    ],
    RelExpr_match: [
      'define',
      { sourceInterval: [132, 182] },
      null,
      [],
      [
        'seq',
        { sourceInterval: [132, 173] },
        ['app', { sourceInterval: [132, 139] }, 'RelExpr', []],
        [
          'alt',
          { sourceInterval: [141, 165] },
          ['terminal', { sourceInterval: [141, 145] }, '>='],
          ['terminal', { sourceInterval: [148, 152] }, '<='],
          ['terminal', { sourceInterval: [156, 159] }, '>'],
          ['terminal', { sourceInterval: [162, 165] }, '<'],
        ],
        ['app', { sourceInterval: [167, 173] }, 'InExpr', []],
      ],
    ],
    RelExpr_match_eq: [
      'define',
      { sourceInterval: [189, 242] },
      null,
      [],
      [
        'seq',
        { sourceInterval: [189, 230] },
        ['app', { sourceInterval: [189, 196] }, 'RelExpr', []],
        [
          'alt',
          { sourceInterval: [198, 222] },
          ['terminal', { sourceInterval: [198, 202] }, '=='],
          ['terminal', { sourceInterval: [205, 209] }, '!='],
          ['terminal', { sourceInterval: [212, 216] }, '<>'],
          ['terminal', { sourceInterval: [219, 222] }, '='],
        ],
        ['app', { sourceInterval: [224, 230] }, 'InExpr', []],
      ],
    ],
    RelExpr_has: [
      'define',
      { sourceInterval: [249, 275] },
      null,
      [],
      [
        'seq',
        { sourceInterval: [249, 268] },
        ['app', { sourceInterval: [249, 256] }, 'RelExpr', []],
        ['terminal', { sourceInterval: [257, 260] }, ':'],
        ['app', { sourceInterval: [261, 268] }, 'literal', []],
      ],
    ],
    RelExpr: [
      'define',
      { sourceInterval: [118, 288] },
      null,
      [],
      [
        'alt',
        { sourceInterval: [132, 288] },
        ['app', { sourceInterval: [132, 173] }, 'RelExpr_match', []],
        ['app', { sourceInterval: [189, 230] }, 'RelExpr_match_eq', []],
        ['app', { sourceInterval: [249, 268] }, 'RelExpr_has', []],
        ['app', { sourceInterval: [282, 288] }, 'InExpr', []],
      ],
    ],
    InExpr_match: [
      'define',
      { sourceInterval: [304, 328] },
      null,
      [],
      [
        'seq',
        { sourceInterval: [304, 319] },
        ['app', { sourceInterval: [304, 310] }, 'InExpr', []],
        ['app', { sourceInterval: [311, 313] }, 'in', []],
        ['app', { sourceInterval: [314, 319] }, 'Array', []],
      ],
    ],
    InExpr: [
      'define',
      { sourceInterval: [291, 348] },
      null,
      [],
      [
        'alt',
        { sourceInterval: [304, 348] },
        ['app', { sourceInterval: [304, 319] }, 'InExpr_match', []],
        ['app', { sourceInterval: [335, 348] }, 'PredicateExpr', []],
      ],
    ],
    PredicateExpr_is: [
      'define',
      { sourceInterval: [371, 406] },
      null,
      [],
      [
        'seq',
        { sourceInterval: [371, 400] },
        ['app', { sourceInterval: [371, 384] }, 'PredicateExpr', []],
        ['app', { sourceInterval: [385, 387] }, 'is', []],
        [
          'alt',
          { sourceInterval: [389, 399] },
          ['app', { sourceInterval: [389, 393] }, 'null', []],
          ['app', { sourceInterval: [395, 399] }, 'bool', []],
        ],
      ],
    ],
    PredicateExpr_like: [
      'define',
      { sourceInterval: [413, 446] },
      null,
      [],
      [
        'seq',
        { sourceInterval: [413, 438] },
        ['app', { sourceInterval: [413, 426] }, 'PredicateExpr', []],
        ['app', { sourceInterval: [427, 431] }, 'like', []],
        ['app', { sourceInterval: [432, 438] }, 'string', []],
      ],
    ],
    PredicateExpr: [
      'define',
      { sourceInterval: [351, 464] },
      null,
      [],
      [
        'alt',
        { sourceInterval: [371, 464] },
        ['app', { sourceInterval: [371, 400] }, 'PredicateExpr_is', []],
        ['app', { sourceInterval: [413, 438] }, 'PredicateExpr_like', []],
        ['app', { sourceInterval: [453, 464] }, 'BetweenExpr', []],
      ],
    ],
    BetweenExpr_match: [
      'define',
      { sourceInterval: [485, 537] },
      null,
      [],
      [
        'seq',
        { sourceInterval: [485, 528] },
        ['app', { sourceInterval: [485, 496] }, 'BetweenExpr', []],
        ['app', { sourceInterval: [497, 504] }, 'between', []],
        ['app', { sourceInterval: [505, 513] }, 'CallExpr', []],
        ['terminal', { sourceInterval: [514, 519] }, 'and'],
        ['app', { sourceInterval: [520, 528] }, 'CallExpr', []],
      ],
    ],
    BetweenExpr: [
      'define',
      { sourceInterval: [467, 552] },
      null,
      [],
      [
        'alt',
        { sourceInterval: [485, 552] },
        ['app', { sourceInterval: [485, 528] }, 'BetweenExpr_match', []],
        ['app', { sourceInterval: [544, 552] }, 'CallExpr', []],
      ],
    ],
    CallExpr_match: [
      'define',
      { sourceInterval: [570, 609] },
      null,
      [],
      [
        'seq',
        { sourceInterval: [570, 600] },
        ['app', { sourceInterval: [570, 575] }, 'ident', []],
        ['terminal', { sourceInterval: [576, 579] }, '('],
        [
          'app',
          { sourceInterval: [580, 596] },
          'ListOf',
          [
            ['app', { sourceInterval: [587, 591] }, 'Expr', []],
            ['terminal', { sourceInterval: [592, 595] }, ','],
          ],
        ],
        ['terminal', { sourceInterval: [597, 600] }, ')'],
      ],
    ],
    CallExpr: [
      'define',
      { sourceInterval: [555, 623] },
      null,
      [],
      [
        'alt',
        { sourceInterval: [570, 623] },
        ['app', { sourceInterval: [570, 600] }, 'CallExpr_match', []],
        ['app', { sourceInterval: [616, 623] }, 'PriExpr', []],
      ],
    ],
    PriExpr_paren: [
      'define',
      { sourceInterval: [641, 662] },
      null,
      [],
      [
        'seq',
        { sourceInterval: [641, 653] },
        ['terminal', { sourceInterval: [641, 644] }, '('],
        ['app', { sourceInterval: [645, 649] }, 'Expr', []],
        ['terminal', { sourceInterval: [650, 653] }, ')'],
      ],
    ],
    PriExpr_not: [
      'define',
      { sourceInterval: [669, 703] },
      null,
      [],
      [
        'seq',
        { sourceInterval: [669, 696] },
        [
          'app',
          { sourceInterval: [669, 691] },
          'caseInsensitive',
          [['terminal', { sourceInterval: [685, 690] }, 'not']],
        ],
        ['app', { sourceInterval: [692, 696] }, 'Expr', []],
      ],
    ],
    PriExpr_pos: [
      'define',
      { sourceInterval: [734, 749] },
      null,
      [],
      [
        'seq',
        { sourceInterval: [734, 742] },
        ['terminal', { sourceInterval: [734, 737] }, '+'],
        ['app', { sourceInterval: [738, 742] }, 'Expr', []],
      ],
    ],
    PriExpr_neg: [
      'define',
      { sourceInterval: [756, 771] },
      null,
      [],
      [
        'seq',
        { sourceInterval: [756, 764] },
        ['terminal', { sourceInterval: [756, 759] }, '-'],
        ['app', { sourceInterval: [760, 764] }, 'Expr', []],
      ],
    ],
    PriExpr: [
      'define',
      { sourceInterval: [627, 771] },
      null,
      [],
      [
        'alt',
        { sourceInterval: [641, 771] },
        ['app', { sourceInterval: [641, 653] }, 'PriExpr_paren', []],
        ['app', { sourceInterval: [669, 696] }, 'PriExpr_not', []],
        ['app', { sourceInterval: [710, 715] }, 'Array', []],
        ['app', { sourceInterval: [722, 727] }, 'Value', []],
        ['app', { sourceInterval: [734, 742] }, 'PriExpr_pos', []],
        ['app', { sourceInterval: [756, 764] }, 'PriExpr_neg', []],
      ],
    ],
    Array: [
      'define',
      { sourceInterval: [776, 837] },
      null,
      [],
      [
        'alt',
        { sourceInterval: [786, 837] },
        [
          'seq',
          { sourceInterval: [786, 810] },
          ['terminal', { sourceInterval: [786, 789] }, '('],
          [
            'app',
            { sourceInterval: [790, 806] },
            'ListOf',
            [
              ['app', { sourceInterval: [797, 801] }, 'Expr', []],
              ['terminal', { sourceInterval: [802, 805] }, ','],
            ],
          ],
          ['terminal', { sourceInterval: [807, 810] }, ')'],
        ],
        [
          'seq',
          { sourceInterval: [813, 837] },
          ['terminal', { sourceInterval: [813, 816] }, '['],
          [
            'app',
            { sourceInterval: [817, 833] },
            'ListOf',
            [
              ['app', { sourceInterval: [824, 828] }, 'Expr', []],
              ['terminal', { sourceInterval: [829, 832] }, ','],
            ],
          ],
          ['terminal', { sourceInterval: [834, 837] }, ']'],
        ],
      ],
    ],
    Value: [
      'define',
      { sourceInterval: [840, 871] },
      null,
      [],
      [
        'alt',
        { sourceInterval: [850, 871] },
        ['app', { sourceInterval: [850, 857] }, 'literal', []],
        ['app', { sourceInterval: [860, 863] }, 'ref', []],
        ['app', { sourceInterval: [866, 871] }, 'ident', []],
      ],
    ],
    ListOf: [
      'override',
      { sourceInterval: [875, 959] },
      null,
      ['elem', 'sep'],
      [
        'alt',
        { sourceInterval: [900, 959] },
        [
          'app',
          { sourceInterval: [900, 930] },
          'TrailNonEmptyListOf',
          [
            ['param', { sourceInterval: [920, 924] }, 0],
            ['param', { sourceInterval: [926, 929] }, 1],
          ],
        ],
        [
          'app',
          { sourceInterval: [937, 959] },
          'EmptyListOf',
          [
            ['param', { sourceInterval: [949, 953] }, 0],
            ['param', { sourceInterval: [955, 958] }, 1],
          ],
        ],
      ],
    ],
    TrailNonEmptyListOf: [
      'define',
      { sourceInterval: [963, 1021] },
      null,
      ['elem', 'sep'],
      [
        'seq',
        { sourceInterval: [1000, 1021] },
        ['param', { sourceInterval: [1000, 1004] }, 0],
        [
          'star',
          { sourceInterval: [1005, 1016] },
          [
            'seq',
            { sourceInterval: [1006, 1014] },
            ['param', { sourceInterval: [1006, 1009] }, 1],
            ['param', { sourceInterval: [1010, 1014] }, 0],
          ],
        ],
        ['opt', { sourceInterval: [1017, 1021] }, ['param', { sourceInterval: [1017, 1020] }, 1]],
      ],
    ],
    in: [
      'define',
      { sourceInterval: [1025, 1084] },
      null,
      [],
      [
        'seq',
        { sourceInterval: [1030, 1084] },
        [
          'opt',
          { sourceInterval: [1030, 1062] },
          [
            'seq',
            { sourceInterval: [1031, 1060] },
            [
              'app',
              { sourceInterval: [1031, 1053] },
              'caseInsensitive',
              [['terminal', { sourceInterval: [1047, 1052] }, 'not']],
            ],
            ['plus', { sourceInterval: [1054, 1060] }, ['app', { sourceInterval: [1054, 1059] }, 'space', []]],
          ],
        ],
        [
          'app',
          { sourceInterval: [1063, 1084] },
          'caseInsensitive',
          [['terminal', { sourceInterval: [1079, 1083] }, 'in']],
        ],
      ],
    ],
    is: [
      'define',
      { sourceInterval: [1087, 1146] },
      null,
      [],
      [
        'seq',
        { sourceInterval: [1092, 1146] },
        [
          'app',
          { sourceInterval: [1092, 1113] },
          'caseInsensitive',
          [['terminal', { sourceInterval: [1108, 1112] }, 'is']],
        ],
        ['plus', { sourceInterval: [1115, 1121] }, ['app', { sourceInterval: [1115, 1120] }, 'space', []]],
        [
          'opt',
          { sourceInterval: [1122, 1145] },
          [
            'app',
            { sourceInterval: [1122, 1144] },
            'caseInsensitive',
            [['terminal', { sourceInterval: [1138, 1143] }, 'not']],
          ],
        ],
      ],
    ],
    logic: [
      'define',
      { sourceInterval: [1149, 1217] },
      null,
      [],
      [
        'alt',
        { sourceInterval: [1157, 1217] },
        [
          'app',
          { sourceInterval: [1157, 1179] },
          'caseInsensitive',
          [['terminal', { sourceInterval: [1173, 1178] }, 'and']],
        ],
        [
          'app',
          { sourceInterval: [1182, 1203] },
          'caseInsensitive',
          [['terminal', { sourceInterval: [1198, 1202] }, 'or']],
        ],
        ['terminal', { sourceInterval: [1206, 1210] }, '&&'],
        ['terminal', { sourceInterval: [1213, 1217] }, '||'],
      ],
    ],
    like: [
      'define',
      { sourceInterval: [1220, 1312] },
      null,
      [],
      [
        'seq',
        { sourceInterval: [1227, 1312] },
        [
          'opt',
          { sourceInterval: [1227, 1259] },
          [
            'seq',
            { sourceInterval: [1228, 1257] },
            [
              'app',
              { sourceInterval: [1228, 1250] },
              'caseInsensitive',
              [['terminal', { sourceInterval: [1244, 1249] }, 'not']],
            ],
            ['plus', { sourceInterval: [1251, 1257] }, ['app', { sourceInterval: [1251, 1256] }, 'space', []]],
          ],
        ],
        [
          'alt',
          { sourceInterval: [1261, 1311] },
          [
            'app',
            { sourceInterval: [1261, 1284] },
            'caseInsensitive',
            [['terminal', { sourceInterval: [1277, 1283] }, 'like']],
          ],
          [
            'app',
            { sourceInterval: [1287, 1311] },
            'caseInsensitive',
            [['terminal', { sourceInterval: [1303, 1310] }, 'ilike']],
          ],
        ],
      ],
    ],
    between: [
      'define',
      { sourceInterval: [1315, 1384] },
      null,
      [],
      [
        'seq',
        { sourceInterval: [1325, 1384] },
        [
          'opt',
          { sourceInterval: [1325, 1357] },
          [
            'seq',
            { sourceInterval: [1326, 1355] },
            [
              'app',
              { sourceInterval: [1326, 1348] },
              'caseInsensitive',
              [['terminal', { sourceInterval: [1342, 1347] }, 'not']],
            ],
            ['plus', { sourceInterval: [1349, 1355] }, ['app', { sourceInterval: [1349, 1354] }, 'space', []]],
          ],
        ],
        [
          'app',
          { sourceInterval: [1358, 1384] },
          'caseInsensitive',
          [['terminal', { sourceInterval: [1374, 1383] }, 'between']],
        ],
      ],
    ],
    ref: [
      'define',
      { sourceInterval: [1388, 1425] },
      null,
      [],
      [
        'seq',
        { sourceInterval: [1394, 1425] },
        ['app', { sourceInterval: [1394, 1399] }, 'ident', []],
        [
          'plus',
          { sourceInterval: [1400, 1425] },
          [
            'seq',
            { sourceInterval: [1402, 1422] },
            ['terminal', { sourceInterval: [1402, 1405] }, '.'],
            [
              'alt',
              { sourceInterval: [1407, 1421] },
              ['app', { sourceInterval: [1407, 1412] }, 'ident', []],
              ['app', { sourceInterval: [1415, 1421] }, 'string', []],
            ],
          ],
        ],
      ],
    ],
    ident: [
      'define',
      { sourceInterval: [1428, 1457] },
      null,
      [],
      [
        'seq',
        { sourceInterval: [1436, 1457] },
        ['app', { sourceInterval: [1436, 1442] }, 'letter', []],
        [
          'star',
          { sourceInterval: [1443, 1457] },
          [
            'alt',
            { sourceInterval: [1444, 1455] },
            ['app', { sourceInterval: [1444, 1449] }, 'alnum', []],
            ['terminal', { sourceInterval: [1452, 1455] }, '_'],
          ],
        ],
      ],
    ],
    literal: [
      'define',
      { sourceInterval: [1460, 1504] },
      null,
      [],
      [
        'alt',
        { sourceInterval: [1470, 1504] },
        ['app', { sourceInterval: [1470, 1476] }, 'string', []],
        ['app', { sourceInterval: [1479, 1484] }, 'float', []],
        ['app', { sourceInterval: [1487, 1490] }, 'int', []],
        ['app', { sourceInterval: [1493, 1497] }, 'bool', []],
        ['app', { sourceInterval: [1500, 1504] }, 'null', []],
      ],
    ],
    null: [
      'define',
      { sourceInterval: [1507, 1532] },
      null,
      [],
      [
        'alt',
        { sourceInterval: [1517, 1532] },
        ['terminal', { sourceInterval: [1517, 1523] }, 'null'],
        ['terminal', { sourceInterval: [1526, 1532] }, 'NULL'],
      ],
    ],
    bool: [
      'define',
      { sourceInterval: [1535, 1580] },
      null,
      [],
      [
        'alt',
        { sourceInterval: [1545, 1580] },
        ['terminal', { sourceInterval: [1545, 1551] }, 'true'],
        ['terminal', { sourceInterval: [1554, 1561] }, 'false'],
        ['terminal', { sourceInterval: [1564, 1570] }, 'TRUE'],
        ['terminal', { sourceInterval: [1573, 1580] }, 'FALSE'],
      ],
    ],
    string: [
      'define',
      { sourceInterval: [1583, 1644] },
      null,
      [],
      [
        'alt',
        { sourceInterval: [1596, 1644] },
        [
          'seq',
          { sourceInterval: [1596, 1615] },
          ['terminal', { sourceInterval: [1596, 1599] }, "'"],
          [
            'star',
            { sourceInterval: [1600, 1611] },
            [
              'seq',
              { sourceInterval: [1601, 1609] },
              ['not', { sourceInterval: [1601, 1605] }, ['terminal', { sourceInterval: [1602, 1605] }, "'"]],
              ['app', { sourceInterval: [1606, 1609] }, 'any', []],
            ],
          ],
          ['terminal', { sourceInterval: [1612, 1615] }, "'"],
        ],
        [
          'seq',
          { sourceInterval: [1622, 1644] },
          ['terminal', { sourceInterval: [1622, 1626] }, '"'],
          [
            'star',
            { sourceInterval: [1627, 1639] },
            [
              'seq',
              { sourceInterval: [1628, 1637] },
              ['not', { sourceInterval: [1628, 1633] }, ['terminal', { sourceInterval: [1629, 1633] }, '"']],
              ['app', { sourceInterval: [1634, 1637] }, 'any', []],
            ],
          ],
          ['terminal', { sourceInterval: [1640, 1644] }, '"'],
        ],
      ],
    ],
    int: [
      'define',
      { sourceInterval: [1647, 1677] },
      null,
      [],
      [
        'seq',
        { sourceInterval: [1653, 1677] },
        [
          'opt',
          { sourceInterval: [1653, 1672] },
          [
            'seq',
            { sourceInterval: [1654, 1670] },
            [
              'alt',
              { sourceInterval: [1655, 1662] },
              ['terminal', { sourceInterval: [1655, 1658] }, '-'],
              ['terminal', { sourceInterval: [1659, 1662] }, '+'],
            ],
            ['app', { sourceInterval: [1664, 1670] }, 'spaces', []],
          ],
        ],
        ['app', { sourceInterval: [1673, 1677] }, 'uint', []],
      ],
    ],
    uint: [
      'define',
      { sourceInterval: [1680, 1713] },
      null,
      [],
      [
        'alt',
        { sourceInterval: [1691, 1713] },
        ['terminal', { sourceInterval: [1691, 1694] }, '0'],
        ['app', { sourceInterval: [1701, 1713] }, 'int_non_zero', []],
      ],
    ],
    int_non_zero: [
      'define',
      { sourceInterval: [1716, 1746] },
      null,
      [],
      [
        'seq',
        { sourceInterval: [1731, 1746] },
        ['range', { sourceInterval: [1731, 1739] }, '1', '9'],
        ['star', { sourceInterval: [1740, 1746] }, ['app', { sourceInterval: [1740, 1745] }, 'digit', []]],
      ],
    ],
    float: [
      'define',
      { sourceInterval: [1749, 1774] },
      null,
      [],
      [
        'seq',
        { sourceInterval: [1759, 1774] },
        ['opt', { sourceInterval: [1759, 1763] }, ['app', { sourceInterval: [1759, 1762] }, 'int', []]],
        ['terminal', { sourceInterval: [1764, 1767] }, '.'],
        ['plus', { sourceInterval: [1768, 1774] }, ['app', { sourceInterval: [1768, 1773] }, 'digit', []]],
      ],
    ],
  },
]);
export default result;