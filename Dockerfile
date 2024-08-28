# Use the official Node.js 14 image as a base
FROM node:20

# Set the working directory to /app
WORKDIR /app

# Copy the package*.json files into the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the application code into the container
COPY . .

# Expose the port that your app will listen on
EXPOSE 3000

# Run the command to start your app when the container starts
CMD ["npm", "start"]
