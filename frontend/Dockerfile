# frontend/Dockerfile.frontend

# Use a Node.js base image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your frontend code
COPY . .

# Run the build command to create static files in the 'dist' folder
RUN npm run build