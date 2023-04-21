FROM wener/node:18

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

COPY rootfs /
RUN mkdir -p /app && chown -R nodejs:nodejs /app
WORKDIR /app

# install if packages.json exists
RUN test ! -f packages.json || { npm i && npm cache clean --force; }

RUN --mount=type=cache,target=/root/.npm/ \
    npm add -g sharp pg --platform=linuxmusl
ENV NEXT_SHARP_PATH=/usr/local/lib/node_modules/sharp
USER nodejs

#

ARG APP_NAME
ENV APP_NAME $APP_NAME
ARG DIR_NAME

# assume apps/APP_NAME/packages.json
COPY next.config.mjs ./apps/${DIR_NAME}/
COPY public ./apps/${DIR_NAME}/public
COPY package.json ./apps/${DIR_NAME}/package.json

COPY --chown=nodejs:nodejs .next/standalone ./
COPY --chown=nodejs:nodejs .next/static ./apps/${DIR_NAME}/.next/static

WORKDIR /app/apps/${DIR_NAME}

ENV PORT 3000
EXPOSE 3000

# monorepo
CMD ["node", "server.js"]
