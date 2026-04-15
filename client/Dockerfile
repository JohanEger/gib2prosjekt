FROM node:20-alpine AS build
WORKDIR /app

# Standard når compose ikke sender build-arg (tom streng i Vite gir feil fetch-URL).
ARG VITE_BACKEND_BASE_URL=http://localhost:5001
ENV VITE_BACKEND_BASE_URL=$VITE_BACKEND_BASE_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
