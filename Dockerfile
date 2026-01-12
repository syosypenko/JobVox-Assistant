FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install --silent
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
ENV PORT=8080
ENV BACKEND_URL=http://backend:8000
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
