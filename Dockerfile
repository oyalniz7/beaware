FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Client and Template DB
# Generate Client and Template DB
# Use absolute path in root to avoid subdirectory confusion
ENV DATABASE_URL="file:///app/dev.db"
RUN npx prisma generate
RUN npx prisma db push

# Build App
RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create db directory
RUN mkdir -p /app/prisma && chown nextjs:nodejs /app/prisma

# Copy Prisma Schema (Explicitly)
COPY --from=builder --chown=nextjs:nodejs /app/prisma/schema.prisma ./prisma/schema.prisma

# Init DB script coverage
CMD ["sh", "-c", "echo 'Current directory:'; pwd; echo 'Prisma folder:'; ls -R /app/prisma; if [ ! -f /app/prisma/dev.db ]; then echo 'Initializing DB...'; cp /app/dev.db.template /app/prisma/dev.db; fi; node server.js"]
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Template DB (created in builder at root)
COPY --from=builder --chown=nextjs:nodejs /app/dev.db /app/dev.db.template

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Init DB script
# CMD ["sh", "-c", "if [ ! -f /app/prisma/dev.db ]; then echo 'Initializing DB...'; cp /app/dev.db.template /app/prisma/dev.db; fi; node server.js"]
