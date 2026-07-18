# Server

## service

- NATS based microservice

## Common Dependencies for server dev

```bash
pnpm add @nestjs/{common,core,platform-fastify,serve-static,swagger} fastify
pnpm add @wener/{miniquery,nestjs,utils} dayjs reflect-metadata
# for micro-orm
pnpm add @micro-orm/{core,nestjs,postgresql}
# for zod based model validation
pnpm add zod @anatine/zod-nestjs @anatine/zod-openapi
# for NATS based microservice
pnpm add @nats-io/nats-core @nats-io/services @nats-io/transport-node
# for file upload
pnpm add @nest-lab/fastify-multer
# nestjs deps
pnpm add cache-manager class-transformer class-validator
```
