# ------------------------------
# Base image
# ------------------------------
FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# ------------------------------
# Dependencies (prod)
# ------------------------------
FROM base AS deps

COPY pnpm-lock.yaml package.json ./
RUN pnpm fetch --prod
RUN pnpm install --prod --offline --frozen-lockfile

# ------------------------------
# Builder stage
# ------------------------------
FROM base AS build

COPY pnpm-lock.yaml package.json ./
RUN pnpm fetch
RUN pnpm install --offline --frozen-lockfile

COPY . .
RUN pnpm run build

# ------------------------------
# Production runtime
# ------------------------------
FROM base AS runtime

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

CMD ["pnpm", "start"]