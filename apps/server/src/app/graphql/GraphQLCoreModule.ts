import path from 'node:path';
import type { DynamicModule } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { MercuriusDriver, type MercuriusDriverConfig } from '@nestjs/mercurius';

export class GraphQLCoreModule {
  static forRoot({ name }: { name: string }): DynamicModule {
    return {
      module: GraphQLCoreModule,
      imports: [
        GraphQLModule.forRoot<MercuriusDriverConfig>({
          driver: MercuriusDriver,
          graphiql: true,
          autoSchemaFile: path.join(__dirname, `src/apps/${name}/schema.graphql`),
          sortSchema: true,
          subscription: true,
        }),
      ],
    };
  }
}
