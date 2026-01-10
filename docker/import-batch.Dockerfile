FROM node:24-slim

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.26.1 --activate
RUN useradd --create-home --shell /bin/bash appuser

# Copy package files and scripts directory (needed for preinstall hook)
COPY package.json pnpm-lock.yaml ./
COPY scripts/ ./scripts/
COPY vendor/sst/ ./vendor/sst/
RUN pnpm install --frozen-lockfile

# Copy the rest of the application
COPY . .

RUN chown -R appuser:appuser /app
USER appuser

CMD ["pnpm", "exec", "tsx", "src/workers/import-batch.ts"]
