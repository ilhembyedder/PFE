# syntax=docker/dockerfile:1

# Multi-stage build producing a standalone server.
# The previous image ran `npm run dev`, which meant NODE_ENV=development in
# "production" — and therefore the hardcoded fallback cookie secret. It also
# passed --strict-ssl=false, disabling TLS verification for the whole install.

# Extra CA certificates for networks that intercept HTTPS (see certs/README.md).
# `certs` is a named build context supplied by compose. Node reads the bundle
# through NODE_EXTRA_CA_CERTS; an empty bundle is a no-op.
FROM node:22-alpine AS certs-bundle
COPY --from=certs . /tmp/certs/
RUN touch /extra-ca.pem \
    && for f in /tmp/certs/*.crt; do [ -e "$f" ] && cat "$f" >> /extra-ca.pem; done; true

FROM node:22-alpine AS deps
WORKDIR /app
COPY --from=certs-bundle /extra-ca.pem /etc/ssl/extra-ca.pem
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/extra-ca.pem
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# next/font/google downloads font files at build time. Turbopack fetches them
# with its own TLS stack, which ignores NODE_EXTRA_CA_CERTS, so the extra CAs
# also go into the system bundle and Turbopack is told to read it.
COPY --from=certs-bundle /extra-ca.pem /etc/ssl/extra-ca.pem
RUN cat /etc/ssl/extra-ca.pem >> /etc/ssl/certs/ca-certificates.crt
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/extra-ca.pem
ENV NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1
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
