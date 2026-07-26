# syntax=docker/dockerfile:1

# Multi-stage build producing a standalone server.
# The previous image ran `npm run dev`, which meant NODE_ENV=development in
# "production" — and therefore the hardcoded fallback cookie secret. It also
# passed --strict-ssl=false, disabling TLS verification for the whole install.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# A build-time placeholder: crypto.ts fails closed without it, and the real
# secret is supplied at runtime.
ENV BFF_COOKIE_SECRET=build-time-placeholder-not-used-at-runtime
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Runs unprivileged. node:alpine already provides uid/gid 1000.
RUN mkdir .next && chown node:node .next

COPY --from=builder /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/login').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
