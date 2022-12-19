# ohm-grammar-miniquery

SQL Where like filter expression for sequelize

## Sequelize

```ts
import {toSequelizeWhere} from 'ohm-grammar-miniquery/sequelize';

await User.findAll({
  where: toSequelizeWhere(`name like 'wen%' and age > 18`),
});
```
