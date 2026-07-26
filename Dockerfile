# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Defaults target staging. Production CI must pass api.roamkit.net / roamkit.net.
ARG NEXT_PUBLIC_API_URL=https://api.staging.roamkit.net
ARG NEXT_PUBLIC_APP_URL=https://staging.roamkit.net
ARG NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
ARG ROAMKIT_GIT_SHA=
ARG ROAMKIT_BUILD_DATE=
ARG ROAMKIT_IMAGE_TAG=
ARG ROAMKIT_ENVIRONMENT=
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=${NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID}
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

FROM node:22-alpine AS runtime

WORKDIR /app

ARG ROAMKIT_GIT_SHA=
ARG ROAMKIT_BUILD_DATE=
ARG ROAMKIT_IMAGE_TAG=
ARG ROAMKIT_ENVIRONMENT=

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV ROAMKIT_GIT_SHA=${ROAMKIT_GIT_SHA}
ENV ROAMKIT_BUILD_DATE=${ROAMKIT_BUILD_DATE}
ENV ROAMKIT_IMAGE_TAG=${ROAMKIT_IMAGE_TAG}
ENV ROAMKIT_ENVIRONMENT=${ROAMKIT_ENVIRONMENT}

RUN apk add --no-cache curl \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs \
    && rm -rf \
      /usr/local/lib/node_modules/npm \
      /usr/local/lib/node_modules/corepack \
      /opt/yarn-v* \
      /usr/local/bin/npm \
      /usr/local/bin/npx \
      /usr/local/bin/corepack \
      /usr/local/bin/yarn \
      /usr/local/bin/yarnpkg

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=45s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
