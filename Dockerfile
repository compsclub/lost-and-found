# Builds the API, the static client, and the static file server, then runs them
# in one image. The static server proxies /api/v1 to the API on loopback, so the
# container answers on a single origin and Caddy only needs one upstream.
FROM node:24-bookworm-slim AS build

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@12.15.0 --activate

# Dependency manifests and the Prisma schema first, so this layer is cached
# independently of sources. The schema must be present here because the
# `postinstall` hook runs `prisma generate`, which needs it.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma/schema.prisma ./prisma/schema.prisma
COPY prisma.config.ts ./
RUN pnpm install --frozen-lockfile

COPY . .

# Compiles TypeScript and builds the client; no database is contacted here.
RUN pnpm build

# Production runtime needs the generated Prisma client, so keep it through prune.
# Lifecycle scripts are skipped here: `prisma generate` already ran during
# install, and re-running it mid-prune has no schema context to work with.
RUN pnpm prune --prod --ignore-scripts


# Migration stage: the Prisma CLI is a dev dependency, so it does not survive the
# prune above. Keeping it in its own stage lets the operator apply schema changes
# with `docker compose run --rm migrate` without shipping the CLI in the runtime
# image.
#
# pnpm is installed globally rather than through corepack: corepack downloads the
# requested version on first use, and this stage runs with no network access.
FROM node:24-bookworm-slim AS migrate

WORKDIR /app

RUN npm install --global pnpm@12.15.0

# OpenSSL is required by the Prisma engine.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma
COPY prisma.config.ts ./
# The seed script reads its fixtures from the contract mock directory.
COPY tests/mock ./tests/mock
RUN pnpm install --frozen-lockfile

ENV NODE_ENV=production
USER node

CMD ["pnpm", "exec", "prisma", "migrate", "deploy"]


FROM node:24-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production

# `openssl` is required by the Prisma query engine, `tini` reaps child processes.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl tini \
    && rm -rf /var/lib/apt/lists/*

# Keep the Prisma CLI and migrations available so the operator can apply schema
# changes inside the deployed image with `docker compose exec app ...`.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts

# The runtime entrypoint starts the API and the static server together.
# `COPY` does not preserve the executable bit from the source tree on every
# platform, so mark it explicitly.
COPY --from=build /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod 0755 ./docker-entrypoint.sh

USER node
EXPOSE 8080

ENTRYPOINT ["/usr/bin/tini", "--", "/app/docker-entrypoint.sh"]
