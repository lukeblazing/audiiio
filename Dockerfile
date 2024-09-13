# Stage 1: Build the Client
FROM node:20 AS client-build
WORKDIR /app/Client
COPY ./Client/package.json ./
RUN npm install
COPY ./Client ./
RUN npm run build

# Stage 2: Build the Server
FROM node:20 AS server-build
WORKDIR /app/Server
COPY ./Server/package.json ./
RUN npm install --production
COPY ./Server ./

# Stage 3: Production Image
FROM node:20
WORKDIR /app/Server
COPY --from=server-build /app/Server /app/Server
EXPOSE 3000
CMD ["npm", "start"]
