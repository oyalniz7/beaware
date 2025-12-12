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
# Use absolute path for build time to ensure we know where it is
ENV DATABASE_URL="file:./dev.db"
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

# Copy public
COPY --from=builder /app/public ./public

# Copy standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Template DB (created in builder)
COPY --from=builder --chown=nextjs:nodejs /app/prisma/dev.db /app/prisma/dev.db.template

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Init DB script
CMD ["sh", "-c", "if [ ! -f /app/prisma/dev.db ]; then echo 'Initializing DB...'; cp /app/prisma/dev.db.template /app/prisma/dev.db; fi; node server.js"]
