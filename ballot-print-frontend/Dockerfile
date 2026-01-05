# Stage 1: Dependencies
FROM node:24-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

# Stage 2: Builder
FROM node:24-alpine AS builder
WORKDIR /app

# Copy package file and install all dependencies
COPY package.json ./
RUN npm install

# Copy necessary config files
COPY tailwind.config.ts tsconfig.json next.config.js postcss.config.js ./
COPY next-env.d.ts ./

# Copy source code
COPY src ./src
COPY public ./public
COPY dictionaries ./dictionaries
COPY fonts ./fonts
COPY images ./images
COPY lib ./lib

# Copy production environment file
COPY production.e ./.env

# Build the application
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 3: Runner
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy production environment
COPY --chown=nextjs:nodejs production.e ./.env

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
