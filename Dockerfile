FROM node:22-alpine AS deps
RUN apk add --no-cache openssl
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

FROM deps AS migrate
WORKDIR /app
COPY prisma.config.ts ./
COPY prisma ./prisma
CMD ["npx", "prisma", "migrate", "deploy"]

FROM deps AS tools
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN npx prisma generate
CMD ["npm", "run", "dev:check"]

FROM node:22-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run db:generate && npm run build

FROM node:22-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
RUN mkdir -p /app/uploads && chown nextjs:nodejs /app/uploads
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
# Next.js writes optimized images and prerender output here at runtime. Production may override the
# runtime uid (the Strato compose runs as 1000:1000), so make it writable like /tmp rather than by owner only.
RUN mkdir -p /app/.next/cache && chown nextjs:nodejs /app/.next/cache && chmod 1777 /app/.next/cache
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV MEDIA_UPLOAD_ROOT=/app/uploads
CMD ["node", "server.js"]
