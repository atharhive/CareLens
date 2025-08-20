# Base image for building Next.js
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Copy the frontend project
COPY frontend/ .

# Copy docs directory from root to make it available for the docs page
COPY docs/ ./docs/

# Build the Next.js app
RUN npm run build

# Production image (lightweight)
FROM node:20-alpine AS runner

# Set working directory
WORKDIR /app

# Copy built Next.js app from builder
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/docs ./docs

# Expose port 6070
EXPOSE 3000

# Start Next.js app
CMD ["npm", "start"]
