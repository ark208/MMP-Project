# Multi-stage Dockerfile for CampusLoop Backend Server
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root monorepo config
COPY package.json package-lock.json ./
COPY server/package.json ./server/

# Install dependencies
RUN npm ci --workspace=server

# Copy server source and prisma schema
COPY server/ ./server/
COPY docs/ ./docs/

# Generate Prisma Client & compile TypeScript
WORKDIR /app/server
RUN npx prisma generate
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install openssl for Prisma runtime
RUN apk add --no-cache openssl

# Copy root monorepo config and production dependencies
COPY package.json package-lock.json ./
COPY server/package.json ./server/
RUN npm ci --workspace=server --omit=dev

# Copy compiled code and prisma schema
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/prisma ./server/prisma
COPY --from=builder /app/server/node_modules/.prisma ./server/node_modules/.prisma
COPY --from=builder /app/server/node_modules/@prisma ./server/node_modules/@prisma

WORKDIR /app/server

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 5000

CMD ["node", "dist/index.js"]

