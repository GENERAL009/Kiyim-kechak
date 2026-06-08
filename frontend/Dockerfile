# 1-bosqich: React ilovasini yig'ish (Build)
FROM node:20-alpine as build-stage

WORKDIR /app

# Copy dependency configs
COPY package.json ./

# Install packages
RUN npm install

# Copy source code
COPY . .

# Build project
RUN npm run build

# 2-bosqich: Nginx orqali static fayllarni tarqatish
FROM nginx:alpine

# Copy built static files
COPY --from=build-stage /app/dist /usr/share/nginx/html

# SPA routingni to'g'ri ishlashi uchun Nginx configuration yozish
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    error_page 500 502 503 504 /50x.html; \
    location = /50x.html { \
        root /usr/share/nginx/html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
