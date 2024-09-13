# Use Node.js 20 as the base image for the build stage
FROM node:20 AS build-stage

# Set the working directory to /app/Server
WORKDIR /app/Server

# Copy package.json and package-lock.json for the server
COPY ./Server/package*.json ./

# Install dependencies for the server
RUN npm install --production

# Copy the server source code
COPY ./Server ./

# Set the working directory to /app/Client
WORKDIR /app/Client

# Copy package.json and package-lock.json for the client
COPY ./Client/package*.json ./

# Install dependencies for the client
RUN npm install

# Copy the client source code
COPY ./Client ./

# Build the client
RUN npm run build

# Use a new stage to create a smaller image for the server
FROM node:20

# Set the working directory to /app/Server
WORKDIR /app/Server

# Copy the server code and the client build from the build stage
COPY --from=build-stage /app/Server /app/Server

# Expose the port your app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
