FROM node:20-alpine

# Install libc6-compat for Prisma (standard requirement for alpine Node images)
RUN apk add --no-cache libc6-compat openssl

# Set working directory
WORKDIR /app

# Copy package.json and lockfile
COPY package.json package-lock.json ./

# Install dependencies (since this is dev, we don't need --production)
RUN npm install

# Copy the rest of the application code
COPY . .

# Generate prisma client explicitly during build to be safe
RUN npx prisma generate

# Expose Next.js port
EXPOSE 3000

# Start command is set in docker-compose.yml to enable db dependency checking
CMD ["npm", "run", "dev"]
