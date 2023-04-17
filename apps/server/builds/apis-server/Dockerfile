FROM wener/node:18

WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

COPY rootfs /
RUN mkdir -p /app && chown -R nodejs:nodejs /app
RUN --mount=type=cache,target=/root/.npm/ \
    npm add -g sharp pg --platform=linuxmusl
ENV NEXT_SHARP_PATH=/usr/local/lib/node_modules/sharp

USER nodejs

RUN  npm i && npm cache clean --force
COPY --chown=nodejs:nodejs app /app

CMD [ "node" , "--enable-source-maps", "main.mjs" ]
