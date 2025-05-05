# Use an official Node.js runtime as a parent image
FROM node:18-alpine AS builder

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json for better caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the entire application code
COPY . .

# Build the TypeScript code
RUN npm run build

# --- Production Image ---
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy only the compiled files from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Expose the port
EXPOSE 80

# Start the application
CMD ["node", "dist/index.js"]
