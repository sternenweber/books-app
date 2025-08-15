# ========= Build stage =========
FROM node:20-alpine AS build

WORKDIR /app
RUN npm install --global @ui5/cli

# Cache deps
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Build UI5 app
RUN ui5 build --all

# ========= Runtime stage =========
FROM node:20-alpine

WORKDIR /app
RUN npm install --global serve

# Copy built files
COPY --from=build /app/dist ./dist

# Copy entrypoint to inject API_BASE_URL -> dist/env.js
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENV API_BASE_URL=http://localhost:8000
EXPOSE 8080

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["serve", "-s", "dist", "-l", "8080"]
