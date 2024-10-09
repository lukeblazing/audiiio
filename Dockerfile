# Stage 1: Build the Client
FROM node:20 AS client-build
WORKDIR /app/Client
COPY ./Client/package.json ./
RUN npm install
COPY ./Client ./
RUN npm run build-prod

# Copy static assets like manifest.json and icons to the build directory
RUN mkdir -p /app/Client/dist/icons && \
    cp ./public/manifest.json /app/Client/dist/ && \
    cp -r ./public/icons /app/Client/dist/icons

# Stage 2: Build the Server
FROM node:20 AS server-build
WORKDIR /app/Server
COPY ./Server/package.json ./
RUN npm install --production
COPY ./Server ./

# Copy the built client files from Stage 1 to the server's public build folder
COPY --from=client-build /app/Client/dist /app/Server/public/build

# Stage 3: Production Image
FROM node:20
WORKDIR /app/Server
COPY --from=server-build /app/Server /app/Server
EXPOSE 3000
CMD ["npm", "start"]
