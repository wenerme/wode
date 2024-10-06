
# NestJS Server

## service

- NATS based microservice

## Common Dependencies for NestJS dev

```bash
pnpm add @nestjs/{common,core,platform-fastify,serve-static,swagger} fastify
pnpm add @wener/{miniquery,nestjs,utils} dayjs reflect-metadata
# for micro-orm
pnpm add @micro-orm/{core,nestjs,postgresql}
# for zod based model validation
pnpm add zod @anatine/zod-nestjs @anatine/zod-openapi
# for Nats based microservice
pnpm add nats nats.ws
# for file upload
pnpm add @nest-lab/fastify-multer
# nestjs deps
pnpm add cache-manager class-transformer class-validator
```
