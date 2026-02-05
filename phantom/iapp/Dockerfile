# PHANTOM iApp Dockerfile
# Builds a TEE-compatible container for iExec SGX execution

FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source files
COPY src/ ./src/

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./

# Create output directory
RUN mkdir -p /iexec_out /iexec_in

# Set environment
ENV NODE_ENV=production
ENV IEXEC_OUT=/iexec_out
ENV IEXEC_IN=/iexec_in

# Run the application
ENTRYPOINT ["node", "src/app.js"]
