# Multi-stage Dockerfile for CampusLoop Next.js Frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root monorepo config
COPY package.json package-lock.json ./
COPY client/package.json ./client/

# Install dependencies
RUN npm ci --workspace=client

# Copy client source and shared types
COPY client/ ./client/
COPY docs/ ./docs/

WORKDIR /app/client

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
COPY client/package.json ./client/
RUN npm ci --workspace=client --omit=dev

COPY --from=builder /app/client/.next ./client/.next
COPY --from=builder /app/client/public ./client/public
COPY --from=builder /app/client/next.config.mjs ./client/
COPY --from=builder /app/docs ./docs

WORKDIR /app/client

EXPOSE 3000

CMD ["npm", "run", "start"]

