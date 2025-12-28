FROM node:24-slim

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.26.1 --activate

# Copy package files and scripts directory (needed for preinstall hook)
COPY package.json pnpm-lock.yaml ./
COPY scripts/ ./scripts/
RUN pnpm install --frozen-lockfile

# Copy the rest of the application
COPY . .

CMD ["pnpm", "exec", "tsx", "src/workers/import-batch.ts"]
