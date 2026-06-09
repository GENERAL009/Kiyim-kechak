FROM node:20-alpine AS build-stage

WORKDIR /app

COPY package*.json ./

# Install dependencies and fix execute permissions on Alpine
RUN npm ci && chmod +x node_modules/.bin/*

COPY . .

RUN npm run build

# --- Production Stage ---
FROM nginx:alpine

# Copy built static files
COPY --from=build-stage /app/dist /usr/share/nginx/html

# SPA routing: all routes fall back to index.html
RUN printf 'server {\n\
    listen 80;\n\
    location / {\n\
        root /usr/share/nginx/html;\n\
        index index.html index.htm;\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
    error_page 500 502 503 504 /50x.html;\n\
    location = /50x.html {\n\
        root /usr/share/nginx/html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]