# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder

WORKDIR /app

# Install client dependencies & build static assets
COPY client/package*.json ./client/
RUN cd client && npm ci

COPY client/ ./client/
RUN cd client && npm run build

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

# Install build dependencies for better-sqlite3 native compilation on alpine
RUN apk add --no-cache python3 make g++

COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

COPY server/ ./server/
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 3001

VOLUME ["/app/server"]

CMD ["node", "server/index.js"]
