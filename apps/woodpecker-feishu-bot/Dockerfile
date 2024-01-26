FROM wener/node:20

WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs
RUN mkdir -p /app && chown -R nodejs:nodejs /app

USER nodejs

COPY --chown=nodejs:nodejs dist/ /app/

CMD [ "node" , "--enable-source-maps", "/app/main.mjs" ]
