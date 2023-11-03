FROM quay.io/wener/node:18

WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

COPY rootfs /

RUN mkdir -p /app && chown -R nodejs:nodejs /app
USER nodejs
RUN --mount=type=cache,target=/home/nodejs/.npm,uid=1001,gid=1001 \
    npm i sharp pg --platform=linuxmusl

COPY --chown=nodejs:nodejs app /app

CMD [ "node" , "--enable-source-maps", "main.mjs" ]
