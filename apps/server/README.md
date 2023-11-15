# Server Set

## openai-proxy

- OpenAI Proxy Server
- save all request & response for auditing & training
- OpenAI API Key relay - hide real key from client
- [ ] transform image url

```bash
# ensure bun is installed
which bun
# dev
PORT=8080 make dev:openai-proxy
```

- PostgreSQL
- MikroORM
- Bun
- Elysia

## Layout

- /builds
  - docker-bake.hcl - docker-bake config
  - <SERVER>/ - per server build
    - Dockerfile
- /public - static files
- /src
  - /app/ - common app framework
  - /apps/<SERVER>/
    - main.ts - SERVER main entry
  - /modules/<MODULE>/
    - index.ts - MODULE exports

---

- SERVER should contain WebModule & Feature module.
- feature module can share across SERVER
- feature module expose Service
  - RemoteService - service over nats
  - LocalService - service impl

## Dev

```bash
mkdir -p src/{app,apps,libs,db,utils,scripts} src/client/{utils,schemas}
```
