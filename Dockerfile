# ── Stage 1: Install dependencies ──────────────────────────────────
FROM node:22-slim AS deps
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY lib/ lib/
COPY artifacts/api-server/package.json artifacts/api-server/package.json
COPY artifacts/devmind/package.json artifacts/devmind/package.json
COPY scripts/package.json scripts/package.json
RUN pnpm install --frozen-lockfile

# ── Stage 2: Build frontend ───────────────────────────────────────
FROM deps AS build-frontend
COPY tsconfig.base.json tsconfig.json ./
COPY lib/ lib/
COPY artifacts/devmind/ artifacts/devmind/
COPY attached_assets/ attached_assets/
RUN pnpm --filter @workspace/devmind build

# ── Stage 3: Build backend ────────────────────────────────────────
FROM deps AS build-backend
COPY tsconfig.base.json tsconfig.json ./
COPY lib/ lib/
COPY artifacts/api-server/ artifacts/api-server/
RUN pnpm --filter @workspace/api-server build

# ── Stage 4: Production image ─────────────────────────────────────
FROM node:22-slim AS production
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Copy built backend
COPY --from=build-backend /app/artifacts/api-server/dist ./dist

# Copy built frontend
COPY --from=build-frontend /app/artifacts/devmind/dist/public ./artifacts/devmind/dist/public

# Copy production node_modules (only api-server needs runtime deps)
COPY --from=deps /app/node_modules ./node_modules

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
