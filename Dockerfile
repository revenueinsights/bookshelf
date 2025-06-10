# Use Node.js 18 Alpine
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies for Alpine
RUN apk add --no-cache libc6-compat openssl

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev dependencies for build)
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Make start script executable
RUN chmod +x start.sh

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Set environment variable for port
ENV PORT=3000

# Start the application
CMD ["./start.sh"] 