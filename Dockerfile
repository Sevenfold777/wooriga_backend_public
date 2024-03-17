# Base Image
FROM --platform=linux/amd64 node:16-alpine

# Create app directory
WORKDIR /wooriga-backend

# Copy source
COPY . .

# Install packages
RUN npm install

# Build PROD
RUN npm run build

# Make port 3000 available outside this container
EXPOSE 3000

CMD ["node" , "dist/src/main.js"]